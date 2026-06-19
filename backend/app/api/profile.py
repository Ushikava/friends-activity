import os
import uuid

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from core.auth import require_not_observer
from core.settings import AVATARS_DIR, ALLOWED_EXTENSIONS
from core.exceptions import BadRequestError, NotFoundError
from db.session import get_db
from db import user as user_db
from utils.image import compress_image
from schemas.profile import UserProfileOut

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=UserProfileOut)
def get_my_profile(
    user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user:
        raise NotFoundError("Пользователь")
    return user


@router.post("/avatar", response_model=UserProfileOut)
def upload_avatar(
    file: UploadFile = File(...),
    user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise BadRequestError(f"Недопустимый формат файла: {ext}")

    data, final_ext = compress_image(file.file.read(), max_dimension=512)

    filename = f"{uuid.uuid4().hex}{final_ext}"
    filepath = os.path.join(AVATARS_DIR, filename)
    os.makedirs(AVATARS_DIR, exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(data)

    user = user_db.update_avatar_url(db, user_id, f"avatars/{filename}")
    return user


@router.get("/users", response_model=list[UserProfileOut])
def list_users(
    _: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    return user_db.get_all_users(db)
