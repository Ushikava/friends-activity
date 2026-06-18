from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from db.models import Place


def get_places(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    q: str | None = None,
    sort: str = 'newest',
) -> tuple[list[Place], int]:
    query = db.query(Place)
    if q:
        query = query.filter(
            Place.description.isnot(None),
            or_(
                func.word_similarity(q, Place.description) > 0.2,
                Place.description.ilike(f'%{q}%'),
            )
        ).order_by(func.word_similarity(q, Place.description).desc(), Place.uploaded_at.desc())
    elif sort == 'oldest':
        query = query.order_by(Place.uploaded_at.asc())
    else:
        query = query.order_by(Place.uploaded_at.desc())
    total: int = query.count()
    places = query.offset(skip).limit(limit).all()
    return places, total


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


def update_description(db: Session, place_id: int, description: str | None) -> Place | None:
    place = get_place_by_id(db, place_id)
    if not place:
        return None
    place.description = description
    db.commit()
    db.refresh(place)
    return place


def delete_place(db: Session, place_id: int) -> None:
    db.query(Place).filter(Place.id == place_id).delete()
    db.commit()
