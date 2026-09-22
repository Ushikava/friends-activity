from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.models import CoinTransaction, ShopPurchase, UserData

CATEGORY_PET = "pet"
CATEGORY_TOY = "toy"
CATEGORY_DECORATION = "decoration"
CATEGORY_ENVIRONMENT = "environment"
CATEGORY_FOOD = "food"

CATEGORIES: list[str] = [CATEGORY_PET, CATEGORY_TOY, CATEGORY_DECORATION, CATEGORY_ENVIRONMENT, CATEGORY_FOOD]

STACKABLE_CATEGORIES = {CATEGORY_FOOD}

# enable later
PURCHASES_ENABLED = False


@dataclass
class ShopItem:
    id: str
    category: str
    name_ru: str
    name_en: str
    price: int
    icon: str  # emoji placeholder


SHOP_ITEMS: dict[str, ShopItem] = {
    item.id: item for item in [
        ShopItem(id="cat_adopt",   category=CATEGORY_PET,         name_ru="Завести котика",    name_en="Adopt a cat",    price=150, icon="🐱"),

        ShopItem(id="toy_ball",    category=CATEGORY_TOY,         name_ru="Мячик",             name_en="Ball",           price=40,  icon="🧶"),
        ShopItem(id="toy_mouse",   category=CATEGORY_TOY,         name_ru="Игрушечная мышка",  name_en="Toy mouse",      price=40,  icon="🐭"),
        ShopItem(id="toy_feather", category=CATEGORY_TOY,         name_ru="Дразнилка-перо",    name_en="Feather teaser", price=60,  icon="🪶"),

        ShopItem(id="deco_bow",    category=CATEGORY_DECORATION,  name_ru="Бантик",            name_en="Bow",            price=50,  icon="🎀"),
        ShopItem(id="deco_hat",    category=CATEGORY_DECORATION,  name_ru="Шляпка",            name_en="Hat",            price=80,  icon="🎩"),
        ShopItem(id="deco_scarf",  category=CATEGORY_DECORATION,  name_ru="Шарфик",            name_en="Scarf",          price=70,  icon="🧣"),

        ShopItem(id="env_bed",     category=CATEGORY_ENVIRONMENT, name_ru="Лежанка",           name_en="Pet bed",        price=100, icon="🛏️"),
        ShopItem(id="env_house",   category=CATEGORY_ENVIRONMENT, name_ru="Домик",             name_en="Pet house",      price=200, icon="🏠"),
        ShopItem(id="env_rug",     category=CATEGORY_ENVIRONMENT, name_ru="Коврик",            name_en="Rug",            price=60,  icon="🟫"),

        ShopItem(id="food_fish",   category=CATEGORY_FOOD,        name_ru="Рыбка",             name_en="Fish",           price=15,  icon="🐟"),
        ShopItem(id="food_milk",   category=CATEGORY_FOOD,        name_ru="Молоко",            name_en="Milk",           price=10,  icon="🥛"),
        ShopItem(id="food_treat",  category=CATEGORY_FOOD,        name_ru="Вкусняшка",         name_en="Treat",          price=20,  icon="🍪"),
    ]
}


def get_inventory(db: Session, user_id: int) -> dict[str, int]:
    rows = db.query(ShopPurchase).filter(ShopPurchase.user_id == user_id).all()
    return {r.item_id: r.quantity for r in rows}


def purchase_item(db: Session, user_id: int, item_id: str) -> tuple[bool, str]:
    """Attempt to buy `item_id` for `user_id`.

    Returns (ok, error_code). error_code is '' on success, otherwise one of
    'purchases_disabled' | 'unknown_item' | 'already_owned' | 'insufficient_coins'.
    """
    if not PURCHASES_ENABLED:
        return False, "purchases_disabled"

    item = SHOP_ITEMS.get(item_id)
    if not item:
        return False, "unknown_item"

    user = db.query(UserData).filter(UserData.id == user_id).with_for_update().first()
    if not user:
        return False, "unknown_item"

    existing = db.query(ShopPurchase).filter(
        ShopPurchase.user_id == user_id, ShopPurchase.item_id == item_id,
    ).first()
    if existing and item.category not in STACKABLE_CATEGORIES:
        db.rollback()
        return False, "already_owned"

    if user.nya_coins < item.price:
        db.rollback()
        return False, "insufficient_coins"

    user.nya_coins -= item.price
    db.add(CoinTransaction(
        user_id=user_id,
        amount=-item.price,
        reason=f"shop:{item_id}",
        created_at=datetime.now(timezone.utc),
    ))
    if existing:
        existing.quantity += 1
        existing.updated_at = datetime.now(timezone.utc)
    else:
        db.add(ShopPurchase(user_id=user_id, item_id=item_id, quantity=1))

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return False, "already_owned"

    return True, ""
