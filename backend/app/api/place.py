import os
import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from pydantic import BaseModel

from core.auth import require_not_observer
from core.settings import PLACES_DIR, ALLOWED_EXTENSIONS
from db.session import get_db
from db import place as place_db
from db import user as user_db
from db.activity_log import log_activity
from schemas.place import PlaceOut, PlacePage
from utils.image import compress_image
from core.exceptions import ForbiddenError, NotFoundError, BadRequestError


class DescriptionUpdate(BaseModel):
    description: str | None = None


router = APIRouter(prefix="/places", tags=["places"])


@router.get("/", response_model=PlacePage)
def list_places(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return {"items": place_db.get_all_places(db, skip=skip, limit=limit), "total": place_db.count_places(db)}


@router.post("/", response_model=PlaceOut, status_code=201)
def upload_place(
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
    os.makedirs(PLACES_DIR, exist_ok=True)
    with open(os.path.join(PLACES_DIR, filename), "wb") as f:
        f.write(data)

    place = place_db.create_place(db, filename=filename, description=description, user_id=user_id)
    log_activity(db, user_id=user_id, username=user.username, action="place_upload", entity_title=description)
    return place


@router.patch("/{place_id}/description")
def update_place_description(
    place_id: int,
    body: DescriptionUpdate,
    _: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    place = place_db.get_place_by_id(db, place_id)
    if not place:
        raise NotFoundError("Место")
    updated = place_db.update_description(db, place_id, body.description or None)
    return {"id": place_id, "description": updated.description if updated else None}


@router.delete("/{place_id}", status_code=204)
def delete_place(
    place_id: int,
    user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)

    place = place_db.get_place_by_id(db, place_id)
    if not place:
        raise NotFoundError("Место")
    if place.uploaded_by != user_id:
        raise ForbiddenError("Можно удалять только свои ИРЛ фото")

    filepath = os.path.join(PLACES_DIR, place.filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    log_activity(db, user_id=user_id, username=user.username, action="place_delete", entity_title=place.description)
    place_db.delete_place(db, place_id)
