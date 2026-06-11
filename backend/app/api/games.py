import os
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.auth import get_user_from_token
from db.session import SessionLocal
from db import games as game_db
from db import user as user_db
from schemas.games import GameOut
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


@router.get("/", response_model=list[GameOut])
def list_games(db: Session = Depends(get_db)):
    return game_db.get_all_games(db)


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


@router.patch("/{game_id}/played", response_model=GameOut)
def toggle_played(
    game_id: int,
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    if not user or user.role == "observer":
        raise ForbiddenError()
    game = game_db.toggle_played(db, game_id)
    if not game:
        raise NotFoundError("Игра")
    return game


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
