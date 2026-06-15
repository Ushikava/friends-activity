import os
import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from pydantic import BaseModel

from core.auth import get_user_from_token, get_optional_user
from db.session import SessionLocal
from db import photo as photo_db
from db import user as user_db
from db.activity_log import log_activity
from schemas.photo import PhotoOut, PhotoPage
from utils.image import compress_image
from core.exceptions import ForbiddenError, NotFoundError, BadRequestError


class DescriptionUpdate(BaseModel):
    description: str | None = None

UPLOADS_DIR = "uploads/photos"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

router = APIRouter(prefix="/photos", tags=["photos"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=PhotoPage)
def list_photos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return {"items": photo_db.get_all_photos(db, skip=skip, limit=limit), "total": photo_db.count_photos(db)}


@router.post("/", response_model=PhotoOut)
def upload_photo(
    file: UploadFile = File(...),
    description: str | None = Form(None),
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise BadRequestError("Недопустимый формат файла")

    try:
        data, ext = compress_image(file.file.read(), max_dimension=1920)
    except ValueError as e:
        raise BadRequestError(str(e))

    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    os.makedirs(UPLOADS_DIR, exist_ok=True)

    with open(filepath, "wb") as f:
        f.write(data)

    photo = photo_db.create_photo(db, filename=filename, description=description, user_id=user_id)
    log_activity(db, user_id=user_id, username=user.username, action="photo_upload", entity_title=description)
    return photo


@router.patch("/{photo_id}/description")
def update_photo_description(
    photo_id: int,
    body: DescriptionUpdate,
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()
    photo = photo_db.get_photo_by_id(db, photo_id)
    if not photo:
        raise NotFoundError("Фото")
    updated = photo_db.update_description(db, photo_id, body.description or None)
    return {"id": photo_id, "description": updated.description if updated else None}


@router.delete("/{photo_id}")
def delete_photo(
    photo_id: int,
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()

    photo = photo_db.get_photo_by_id(db, photo_id)
    if not photo:
        raise NotFoundError("Фото")
    if photo.uploaded_by != user_id:
        raise ForbiddenError("Можно удалять только свои фото")

    filepath = os.path.join(UPLOADS_DIR, photo.filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    log_activity(db, user_id=user_id, username=user.username, action="photo_delete", entity_title=photo.description)
    photo_db.delete_photo(db, photo_id)
    return {"status": "ok"}
