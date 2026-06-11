from sqlalchemy.orm import Session

from db.models import Photo


def create_photo(db: Session, filename: str, description: str | None, user_id: int) -> Photo:
    photo = Photo(filename=filename, description=description, uploaded_by=user_id)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


def get_all_photos(db: Session) -> list[Photo]:
    return db.query(Photo).order_by(Photo.uploaded_at.desc()).all()


def get_photo_by_id(db: Session, photo_id: int) -> Photo | None:
    return db.query(Photo).filter(Photo.id == photo_id).first()


def delete_photo(db: Session, photo_id: int) -> None:
    db.query(Photo).filter(Photo.id == photo_id).delete()
    db.commit()
