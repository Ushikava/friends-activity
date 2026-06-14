import os
import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.auth import get_user_from_token
from db.session import SessionLocal
from db import movie as movie_db
from db import user as user_db
from schemas.movie import MovieOut, MoviePage, MovieDetail, MovieWatchUpdate, MovieUpdateOut
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
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    return {"items": movie_db.get_all_movies(db, skip=skip, limit=limit, user_id=user_id), "total": movie_db.count_movies(db)}


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


@router.get("/{movie_id}/detail", response_model=MovieDetail)
def get_movie_detail(
    movie_id: int,
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    detail = movie_db.get_movie_detail(db, movie_id)
    if not detail:
        raise NotFoundError("Фильм")
    return detail


@router.patch("/{movie_id}/watched", response_model=MovieDetail)
def toggle_watched(
    movie_id: int,
    body: MovieWatchUpdate = MovieWatchUpdate(),
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()
    detail = movie_db.toggle_user_watched(
        db, movie_id, user_id, rating=body.rating, review=body.review
    )
    if not detail:
        raise NotFoundError("Фильм")
    return detail


@router.patch("/{movie_id}", response_model=MovieUpdateOut)
def update_movie(
    movie_id: int,
    title: str = Form(...),
    file: UploadFile | None = File(None),
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()

    existing = movie_db.get_movie_by_id(db, movie_id)
    if not existing:
        raise NotFoundError("Фильм")

    new_poster = existing.poster

    if file and file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise BadRequestError("Недопустимый формат файла")
        try:
            data, ext = compress_image(file.file.read(), max_dimension=900)
        except ValueError as e:
            raise BadRequestError(str(e))
        if existing.poster and not existing.poster.startswith("http"):
            old_path = os.path.join("uploads", existing.poster)
            if os.path.exists(old_path):
                os.remove(old_path)
        os.makedirs(POSTERS_DIR, exist_ok=True)
        filename = f"{uuid.uuid4()}{ext}"
        with open(os.path.join(POSTERS_DIR, filename), "wb") as f:
            f.write(data)
        new_poster = f"posters/{filename}"

    updated = movie_db.update_movie(db, movie_id, title=title, poster=new_poster)
    return updated


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
