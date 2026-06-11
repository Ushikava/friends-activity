import os
import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.auth import get_user_from_token
from db.session import SessionLocal
from db import movie as movie_db
from db import user as user_db
from schemas.movie import MovieOut, MoviePage
from utils.image import compress_image
from core.exceptions import ForbiddenError, NotFoundError, BadRequestError

POSTERS_DIR = "uploads/posters"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

router = APIRouter(prefix="/movies", tags=["movies"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=MoviePage)
def list_movies(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return {"items": movie_db.get_all_movies(db, skip=skip, limit=limit), "total": movie_db.count_movies(db)}


@router.post("/", response_model=MovieOut)
def add_movie(
    title: str = Form(...),
    poster_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()

    poster = None

    if file and file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise BadRequestError("Недопустимый формат файла")
        try:
            data, ext = compress_image(file.file.read(), max_dimension=900)
        except ValueError as e:
            raise BadRequestError(str(e))
        os.makedirs(POSTERS_DIR, exist_ok=True)
        filename = f"{uuid.uuid4()}{ext}"
        with open(os.path.join(POSTERS_DIR, filename), "wb") as f:
            f.write(data)
        poster = f"posters/{filename}"
    elif poster_url:
        poster = poster_url

    return movie_db.create_movie(db, title=title, poster=poster, user_id=user_id)


@router.patch("/{movie_id}/watched", response_model=MovieOut)
def toggle_watched(
    movie_id: int,
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()
    movie = movie_db.toggle_watched(db, movie_id)
    if not movie:
        raise NotFoundError("Фильм")
    return movie


@router.delete("/{movie_id}")
def delete_movie(
    movie_id: int,
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()

    movie = movie_db.get_movie_by_id(db, movie_id)
    if not movie:
        raise NotFoundError("Фильм")

    if movie.poster and not movie.poster.startswith("http"):
        path = os.path.join("uploads", movie.poster)
        if os.path.exists(path):
            os.remove(path)

    movie_db.delete_movie(db, movie_id)
    return {"status": "ok"}
