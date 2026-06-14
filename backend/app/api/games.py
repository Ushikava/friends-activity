import os
import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.auth import get_user_from_token
from db.session import SessionLocal
from db import games as game_db
from db import user as user_db
from schemas.games import GameOut, GamePage, GameDetail, GamePlayUpdate, GameUpdateOut
from utils.image import compress_image
from core.exceptions import ForbiddenError, NotFoundError, BadRequestError

POSTERS_DIR = "uploads/games"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

router = APIRouter(prefix="/games", tags=["games"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=GamePage)
def list_games(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    return {"items": game_db.get_all_games(db, skip=skip, limit=limit, user_id=user_id), "total": game_db.count_games(db)}


@router.post("/", response_model=GameOut)
def add_game(
    title: str = Form(...),
    poster_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    steam_link: str | None = Form(None),
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
        poster = f"games/{filename}"
    elif poster_url:
        poster = poster_url

    return game_db.create_game(db, title=title, poster=poster, user_id=user_id, steam_link=steam_link)


@router.get("/{game_id}/detail", response_model=GameDetail)
def get_game_detail(
    game_id: int,
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    detail = game_db.get_game_detail(db, game_id)
    if not detail:
        raise NotFoundError("Игра")
    return detail


@router.patch("/{game_id}/played", response_model=GameDetail)
def toggle_played(
    game_id: int,
    body: GamePlayUpdate = GamePlayUpdate(),
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()
    detail = game_db.toggle_user_played(db, game_id, user_id, rating=body.rating, review=body.review)
    if not detail:
        raise NotFoundError("Игра")
    return detail


@router.patch("/{game_id}", response_model=GameUpdateOut)
def update_game(
    game_id: int,
    title: str = Form(...),
    steam_link: str | None = Form(None),
    file: UploadFile | None = File(None),
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()

    existing = game_db.get_game_by_id(db, game_id)
    if not existing:
        raise NotFoundError("Игра")

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
        new_poster = f"games/{filename}"

    new_steam = steam_link.strip() or None if steam_link is not None else existing.steam_link

    updated = game_db.update_game(db, game_id, title=title, poster=new_poster, steam_link=new_steam)
    return updated


@router.delete("/{game_id}")
def delete_game(
    game_id: int,
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()

    game = game_db.get_game_by_id(db, game_id)
    if not game:
        raise NotFoundError("Игра")

    if game.poster and not game.poster.startswith("http"):
        path = os.path.join("uploads", game.poster)
        if os.path.exists(path):
            os.remove(path)

    game_db.delete_game(db, game_id)
    return {"status": "ok"}
