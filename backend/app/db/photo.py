from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from db.models import Photo


def create_photo(db: Session, filename: str, description: str | None, user_id: int) -> Photo:
    photo = Photo(filename=filename, description=description, uploaded_by=user_id)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


def get_photos(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    q: str | None = None,
    sort: str = 'newest',
) -> tuple[list[Photo], int]:
    query = db.query(Photo)
    if q:
        query = query.filter(
            Photo.description.isnot(None),
            or_(
                func.word_similarity(q, Photo.description) > 0.2,
                Photo.description.ilike(f'%{q}%'),
            )
        ).order_by(func.word_similarity(q, Photo.description).desc(), Photo.uploaded_at.desc())
    elif sort == 'oldest':
        query = query.order_by(Photo.uploaded_at.asc())
    else:
        query = query.order_by(Photo.uploaded_at.desc())
    total: int = query.count()
    photos = query.offset(skip).limit(limit).all()
    return photos, total


def get_all_photos(db: Session, skip: int = 0, limit: int = 20) -> list[Photo]:
    return db.query(Photo).order_by(Photo.uploaded_at.desc()).offset(skip).limit(limit).all()


def count_photos(db: Session) -> int:
    return db.query(func.count(Photo.id)).scalar()


def get_photo_by_id(db: Session, photo_id: int) -> Photo | None:
    return db.query(Photo).filter(Photo.id == photo_id).first()


def update_description(db: Session, photo_id: int, description: str | None) -> Photo | None:
    photo = get_photo_by_id(db, photo_id)
    if not photo:
        return None
    photo.description = description
    db.commit()
    db.refresh(photo)
    return photo


def delete_photo(db: Session, photo_id: int) -> None:
    db.query(Photo).filter(Photo.id == photo_id).delete()
    db.commit()
