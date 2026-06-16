import os
import uuid

import httpx
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.auth import get_user_from_token, require_not_observer
from core.settings import POSTERS_DIR, ALLOWED_EXTENSIONS, TMDB_API_KEY
from db.session import get_db
from db import movie as movie_db
from db import user as user_db
from db.activity_log import log_activity
from schemas.movie import MovieOut, MoviePage, MovieDetail, MovieWatchUpdate, MovieUpdateOut
from utils.image import compress_image
from core.exceptions import NotFoundError, BadRequestError


router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("/", response_model=MoviePage)
def list_movies(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    return {"items": movie_db.get_all_movies(db, skip=skip, limit=limit, user_id=user_id), "total": movie_db.count_movies(db)}


@router.post("/", response_model=MovieOut, status_code=201)
def add_movie(
    title: str = Form(...),
    poster_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)

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

    movie = movie_db.create_movie(db, title=title, poster=poster, user_id=user_id)
    log_activity(db, user_id=user_id, username=user.username, action="movie_add", entity_title=title)
    return movie


@router.get("/tmdb-search")
def tmdb_search(
    q: str = Query(..., min_length=1, max_length=200),
    _: int = Depends(get_user_from_token),
):
    if not TMDB_API_KEY:
        raise BadRequestError("TMDB API ключ не настроен")
    try:
        resp = httpx.get(
            "https://api.themoviedb.org/3/search/multi",
            params={"api_key": TMDB_API_KEY, "query": q, "language": "ru-RU", "page": 1},
            timeout=5.0,
        )
        resp.raise_for_status()
    except httpx.HTTPError:
        raise BadRequestError("TMDB API недоступен")

    results = []
    for item in resp.json().get("results", [])[:10]:
        if item.get("media_type") not in ("movie", "tv"):
            continue
        title = item.get("title") or item.get("name", "")
        poster_path = item.get("poster_path")
        date_str = item.get("release_date") or item.get("first_air_date", "")
        results.append({
            "tmdb_id": item["id"],
            "title": title,
            "year": date_str[:4] if date_str else "",
            "thumbnail": f"https://image.tmdb.org/t/p/w92{poster_path}" if poster_path else "",
            "poster_url": f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else "",
        })
    return results


@router.get("/{movie_id}/detail", response_model=MovieDetail)
def get_movie_detail(
    movie_id: int,
    _: int = Depends(get_user_from_token),
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
    user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)

    detail = movie_db.toggle_user_watched(
        db, movie_id, user_id, rating=body.rating, review=body.review
    )
    if not detail:
        raise NotFoundError("Фильм")
    user_status = next((s for s in detail['statuses'] if s['user_id'] == user_id), None)
    if user_status and user_status['is_watched']:
        has_review = bool(user_status.get('review')) or user_status.get('rating') is not None
        action = "movie_reviewed" if has_review else "movie_watched"
        log_activity(db, user_id=user_id, username=user.username, action=action, entity_title=detail['title'])
    return detail


@router.patch("/{movie_id}", response_model=MovieUpdateOut)
def update_movie(
    movie_id: int,
    title: str = Form(...),
    file: UploadFile | None = File(None),
    _: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
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


@router.delete("/{movie_id}", status_code=204)
def delete_movie(
    movie_id: int,
    user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)

    movie = movie_db.get_movie_by_id(db, movie_id)
    if not movie:
        raise NotFoundError("Фильм")

    if movie.poster and not movie.poster.startswith("http"):
        path = os.path.join("uploads", movie.poster)
        if os.path.exists(path):
            os.remove(path)

    log_activity(db, user_id=user_id, username=user.username, action="movie_delete", entity_title=movie.title)
    movie_db.delete_movie(db, movie_id)
