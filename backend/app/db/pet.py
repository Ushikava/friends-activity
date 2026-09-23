from datetime import datetime, timezone

from sqlalchemy.orm import Session

from db.models import PetState, ShopPurchase
from db.shop import SHOP_ITEMS, CATEGORY_TOY, CATEGORY_FOOD, CATEGORY_ENVIRONMENT, get_inventory

SATIETY_MAX = 100
HAPPINESS_MAX = 100

SATIETY_FULL_DRAIN_DAYS = 10
HAPPINESS_FULL_DRAIN_DAYS = 10

SATIETY_DECAY_PER_HOUR = SATIETY_MAX / (SATIETY_FULL_DRAIN_DAYS * 24)
HAPPINESS_DECAY_PER_HOUR = HAPPINESS_MAX / (HAPPINESS_FULL_DRAIN_DAYS * 24)

HAPPINESS_PER_PLAY = 10

FEED_AMOUNTS: dict[str, int] = {
    "food_milk": 15,
    "food_fish": 25,
    "food_treat": 35,
}

SATIETY_HUNGRY_BELOW = 34
SATIETY_FULL_AT = 67


def _compute_satiety(pet: PetState) -> int:
    """Lazily decay satiety based on elapsed time since the last update — no cron needed."""
    if pet.satiety_updated_at is None:
        return pet.satiety
    now = datetime.now(timezone.utc)
    anchor = pet.satiety_updated_at
    if anchor.tzinfo is None:
        anchor = anchor.replace(tzinfo=timezone.utc)
    hours = max(0.0, (now - anchor).total_seconds() / 3600)
    decayed = pet.satiety - hours * SATIETY_DECAY_PER_HOUR
    return max(0, min(SATIETY_MAX, round(decayed)))


def _compute_happiness(pet: PetState) -> int:
    """Lazily decay happiness based on elapsed time since the last play — same pattern as satiety."""
    if pet.happiness_updated_at is None:
        return pet.happiness
    now = datetime.now(timezone.utc)
    anchor = pet.happiness_updated_at
    if anchor.tzinfo is None:
        anchor = anchor.replace(tzinfo=timezone.utc)
    hours = max(0.0, (now - anchor).total_seconds() / 3600)
    decayed = pet.happiness - hours * HAPPINESS_DECAY_PER_HOUR
    return max(0, min(HAPPINESS_MAX, round(decayed)))


def sprite_state(satiety: int) -> str:
    if satiety < SATIETY_HUNGRY_BELOW:
        return "hungry"
    if satiety >= SATIETY_FULL_AT:
        return "full"
    return "normal"


def get_pet(db: Session, user_id: int) -> PetState | None:
    return db.query(PetState).filter(PetState.user_id == user_id).first()


def _get_pet_for_update(db: Session, user_id: int) -> PetState | None:
    """Same as get_pet, but locks the row for the rest of this transaction —
    use this before any read-then-write on satiety/happiness/environment so
    two near-simultaneous actions (feed + feed, feed + play, ...) serialize
    instead of one silently overwriting the other's increment."""
    return db.query(PetState).filter(PetState.user_id == user_id).with_for_update().first()


def _add_pet_if_needed(db: Session, user_id: int) -> None:
    """Queues a PetState insert if the user doesn't have one yet, without
    committing — the caller controls the transaction so this can be folded
    into the same commit as whatever triggered it (e.g. the cat_adopt
    purchase), instead of being a separate commit that can leave a paid-for
    item with no pet if it fails on its own."""
    if get_pet(db, user_id):
        return
    db.add(PetState(user_id=user_id))


def create_pet_if_needed(db: Session, user_id: int) -> PetState:
    """Standalone version of _add_pet_if_needed that commits on its own —
    used to self-heal a purchase that didn't get a pet (see api/pet.py)."""
    _add_pet_if_needed(db, user_id)
    db.commit()
    return get_pet(db, user_id)


def has_adopted_but_no_pet(db: Session, user_id: int) -> bool:
    """True if the user paid for cat_adopt but somehow has no PetState row —
    the failure mode create_pet_if_needed's self-heal call is for."""
    if get_pet(db, user_id):
        return False
    owns_cat = db.query(ShopPurchase).filter(
        ShopPurchase.user_id == user_id, ShopPurchase.item_id == "cat_adopt",
    ).first()
    return owns_cat is not None


def rename_pet(db: Session, user_id: int, name: str) -> PetState | None:
    pet = get_pet(db, user_id)
    if not pet:
        return None
    clean = name.strip()[:40]
    if clean:
        pet.name = clean
        db.commit()
    return pet


def feed_pet(db: Session, user_id: int, item_id: str) -> tuple[bool, str]:
    """Returns (ok, error_code). error_code is '' on success, otherwise one of
    'no_pet' | 'unknown_item' | 'not_owned'."""
    pet = _get_pet_for_update(db, user_id)
    if not pet:
        return False, "no_pet"

    item = SHOP_ITEMS.get(item_id)
    if not item or item.category != CATEGORY_FOOD:
        db.rollback()
        return False, "unknown_item"

    purchase = db.query(ShopPurchase).filter(
        ShopPurchase.user_id == user_id, ShopPurchase.item_id == item_id,
    ).with_for_update().first()
    if not purchase or purchase.quantity <= 0:
        db.rollback()
        return False, "not_owned"

    pet.satiety = min(SATIETY_MAX, _compute_satiety(pet) + FEED_AMOUNTS.get(item_id, 20))
    pet.satiety_updated_at = datetime.now(timezone.utc)

    purchase.quantity -= 1
    if purchase.quantity <= 0:
        db.delete(purchase)

    db.commit()
    return True, ""


def play_with_pet(db: Session, user_id: int, item_id: str) -> tuple[bool, str]:
    """Returns (ok, error_code). error_code is '' on success, otherwise one of
    'no_pet' | 'unknown_item' | 'not_owned'."""
    pet = _get_pet_for_update(db, user_id)
    if not pet:
        return False, "no_pet"

    item = SHOP_ITEMS.get(item_id)
    if not item or item.category != CATEGORY_TOY:
        db.rollback()
        return False, "unknown_item"

    owned = db.query(ShopPurchase).filter(
        ShopPurchase.user_id == user_id, ShopPurchase.item_id == item_id,
    ).first()
    if not owned:
        db.rollback()
        return False, "not_owned"

    pet.happiness = min(HAPPINESS_MAX, _compute_happiness(pet) + HAPPINESS_PER_PLAY)
    pet.happiness_updated_at = datetime.now(timezone.utc)
    db.commit()
    return True, ""


def set_environment(db: Session, user_id: int, item_id: str | None) -> tuple[bool, str]:
    """Returns (ok, error_code). error_code is '' on success, otherwise one of
    'no_pet' | 'unknown_item' | 'not_owned'."""
    pet = _get_pet_for_update(db, user_id)
    if not pet:
        return False, "no_pet"

    if item_id is not None:
        item = SHOP_ITEMS.get(item_id)
        if not item or item.category != CATEGORY_ENVIRONMENT:
            db.rollback()
            return False, "unknown_item"
        owned = db.query(ShopPurchase).filter(
            ShopPurchase.user_id == user_id, ShopPurchase.item_id == item_id,
        ).first()
        if not owned:
            db.rollback()
            return False, "not_owned"

    pet.active_environment_item_id = item_id
    db.commit()
    return True, ""


def get_pet_view(db: Session, user_id: int) -> dict | None:
    pet = get_pet(db, user_id)
    if not pet:
        return None

    inventory = get_inventory(db, user_id)
    satiety = _compute_satiety(pet)
    happiness = _compute_happiness(pet)

    def owned_items(category: str) -> list[dict]:
        return [
            {
                "id": i.id,
                "icon": i.icon,
                "image": i.image,
                "name_ru": i.name_ru,
                "name_en": i.name_en,
                "quantity": inventory.get(i.id, 0),
            }
            for i in SHOP_ITEMS.values()
            if i.category == category and inventory.get(i.id, 0) > 0
        ]

    now = datetime.now(timezone.utc)
    adopted_at = pet.adopted_at
    if adopted_at and adopted_at.tzinfo is None:
        adopted_at = adopted_at.replace(tzinfo=timezone.utc)
    age_days = max(0, (now - adopted_at).days) if adopted_at else 0

    return {
        "name": pet.name,
        "age_days": age_days,
        "satiety": satiety,
        "sprite": sprite_state(satiety),
        "happiness": happiness,
        "active_environment_item_id": pet.active_environment_item_id,
        "toys": owned_items(CATEGORY_TOY),
        "foods": owned_items(CATEGORY_FOOD),
        "environments": owned_items(CATEGORY_ENVIRONMENT),
    }
