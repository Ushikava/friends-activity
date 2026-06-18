import os
import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from pydantic import BaseModel

from core.auth import require_not_observer
from core.settings import PHOTOS_DIR, ALLOWED_EXTENSIONS
from db.session import get_db
from db import photo as photo_db
from db import user as user_db
from db.activity_log import log_activity
from schemas.photo import PhotoOut, PhotoPage
from utils.image import compress_image
from core.exceptions import ForbiddenError, NotFoundError, BadRequestError


class DescriptionUpdate(BaseModel):
    description: str | None = None


router = APIRouter(prefix="/photos", tags=["photos"])


@router.get("/", response_model=PhotoPage)
def list_photos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    q: str | None = Query(None, max_length=200),
    sort: str = Query('newest'),
    db: Session = Depends(get_db),
):
    items, total = photo_db.get_photos(db, skip=skip, limit=limit, q=q or None, sort=sort)
    return {"items": items, "total": total}


@router.post("/", response_model=PhotoOut, status_code=201)
def upload_photo(
    file: UploadFile = File(...),
    description: str | None = Form(None),
    user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise BadRequestError("Недопустимый формат файла")

    try:
        data, ext = compress_image(file.file.read(), max_dimension=1920)
    except ValueError as e:
        raise BadRequestError(str(e))

    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(PHOTOS_DIR, filename)
    os.makedirs(PHOTOS_DIR, exist_ok=True)

    with open(filepath, "wb") as f:
        f.write(data)

    photo = photo_db.create_photo(db, filename=filename, description=description, user_id=user_id)
    log_activity(db, user_id=user_id, username=user.username, action="photo_upload", entity_title=description)
    return photo


@router.get("/{photo_id}", response_model=PhotoOut)
def get_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = photo_db.get_photo_by_id(db, photo_id)
    if not photo:
        raise NotFoundError("Фото")
    return photo


@router.patch("/{photo_id}/description")
def update_photo_description(
    photo_id: int,
    body: DescriptionUpdate,
    _: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    photo = photo_db.get_photo_by_id(db, photo_id)
    if not photo:
        raise NotFoundError("Фото")

    updated = photo_db.update_description(db, photo_id, body.description or None)
    return {"id": photo_id, "description": updated.description if updated else None}


@router.delete("/{photo_id}", status_code=204)
def delete_photo(
    photo_id: int,
    user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)

    photo = photo_db.get_photo_by_id(db, photo_id)
    if not photo:
        raise NotFoundError("Фото")
    if photo.uploaded_by != user_id:
        raise ForbiddenError("Можно удалять только свои фото")

    filepath = os.path.join(PHOTOS_DIR, photo.filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    log_activity(db, user_id=user_id, username=user.username, action="photo_delete", entity_title=photo.description)
    photo_db.delete_photo(db, photo_id)
