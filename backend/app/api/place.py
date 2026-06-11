import os
import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.auth import get_user_from_token
from db.session import SessionLocal
from db import place as place_db
from db import user as user_db
from schemas.place import PlaceOut, PlacePage
from utils.image import compress_image
from core.exceptions import ForbiddenError, NotFoundError, BadRequestError

UPLOADS_DIR = "uploads/places"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

router = APIRouter(prefix="/places", tags=["places"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=PlacePage)
def list_places(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return {"items": place_db.get_all_places(db, skip=skip, limit=limit), "total": place_db.count_places(db)}


@router.post("/", response_model=PlaceOut)
def upload_place(
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
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    with open(os.path.join(UPLOADS_DIR, filename), "wb") as f:
        f.write(data)

    return place_db.create_place(db, filename=filename, description=description, user_id=user_id)


@router.delete("/{place_id}")
def delete_place(
    place_id: int,
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()

    place = place_db.get_place_by_id(db, place_id)
    if not place:
        raise NotFoundError("Место")
    if place.uploaded_by != user_id:
        raise ForbiddenError("Можно удалять только свои фото")

    filepath = os.path.join(UPLOADS_DIR, place.filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    place_db.delete_place(db, place_id)
    return {"status": "ok"}
