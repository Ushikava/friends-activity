from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from db.models import UserData, CoinTransaction

COIN_REWARDS: dict[str, int] = {
    "photo_upload":    10,
    "place_upload":    10,
    "movie_add":        3,
    "game_add":         3,
    "movie_watched":    5,
    "game_played":      5,
    "movie_reviewed":   8,
    "game_reviewed":    8,
    "wishlist_add":     2,
}

LEVEL_FAMILIES: dict[str, tuple[str, ...]] = {
    "movie_watched":  ("movie_watched", "movie_reviewed"),
    "movie_reviewed": ("movie_watched", "movie_reviewed"),
    "game_played":    ("game_played", "game_reviewed"),
    "game_reviewed":  ("game_played", "game_reviewed"),
}


def _sum_awarded_for_entity(db: Session, user_id: int, entity_type: str, entity_id: int, reasons: tuple[str, ...]) -> int:
    return db.query(func.coalesce(func.sum(CoinTransaction.amount), 0)).filter(
        CoinTransaction.user_id == user_id,
        CoinTransaction.entity_type == entity_type,
        CoinTransaction.entity_id == entity_id,
        CoinTransaction.reason.in_(reasons),
    ).scalar() or 0


def award_coins(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
) -> int:
    """Award coins for an action. Returns coins actually awarded (0 if deduped or unknown action)."""
    amount = COIN_REWARDS.get(action, 0)
    if amount == 0:
        return 0

    family = LEVEL_FAMILIES.get(action)
    if family:
        if entity_type is None or entity_id is None:
            raise ValueError(f"action {action!r} requires entity_type/entity_id")
        already = _sum_awarded_for_entity(db, user_id, entity_type, entity_id, family)
        amount -= already
        if amount <= 0:
            return 0

    db.query(UserData).filter(UserData.id == user_id).update(
        {"nya_coins": UserData.nya_coins + amount}
    )
    db.add(CoinTransaction(
        user_id=user_id,
        amount=amount,
        reason=action,
        entity_type=entity_type,
        entity_id=entity_id,
        created_at=datetime.now(timezone.utc),
    ))
    db.commit()

    return amount


def get_balance(db: Session, user_id: int) -> int:
    user = db.query(UserData.nya_coins).filter(UserData.id == user_id).first()
    return user.nya_coins if user else 0


def get_transactions(db: Session, user_id: int, limit: int = 20) -> list[CoinTransaction]:
    return (
        db.query(CoinTransaction)
        .filter(CoinTransaction.user_id == user_id)
        .order_by(CoinTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
