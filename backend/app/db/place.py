from sqlalchemy import func
from sqlalchemy.orm import Session

from db.models import Place


def get_all_places(db: Session, skip: int = 0, limit: int = 20) -> list[Place]:
    return db.query(Place).order_by(Place.uploaded_at.desc()).offset(skip).limit(limit).all()


def count_places(db: Session) -> int:
    return db.query(func.count(Place.id)).scalar()


def create_place(db: Session, filename: str, description: str | None, user_id: int) -> Place:
    place = Place(filename=filename, description=description, uploaded_by=user_id)
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


def get_place_by_id(db: Session, place_id: int) -> Place | None:
    return db.query(Place).filter(Place.id == place_id).first()


def delete_place(db: Session, place_id: int) -> None:
    db.query(Place).filter(Place.id == place_id).delete()
    db.commit()
