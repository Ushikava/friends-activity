from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.models import Favorite


def toggle_favorite(db: Session, user_id: int, entity_type: str, entity_id: int) -> bool:
    existing = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.entity_type == entity_type,
        Favorite.entity_id == entity_id,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return False
    else:
        db.add(Favorite(user_id=user_id, entity_type=entity_type, entity_id=entity_id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            return True
        return True


def get_favorite_ids(db: Session, user_id: int, entity_type: str) -> set[int]:
    rows = (
        db.query(Favorite.entity_id)
        .filter(Favorite.user_id == user_id, Favorite.entity_type == entity_type)
        .all()
    )
    return {r.entity_id for r in rows}
