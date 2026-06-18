import json
import os
import uuid

import httpx
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.auth import get_user_from_token, require_not_observer
from core.settings import GAMES_DIR, ALLOWED_EXTENSIONS
from db.session import get_db
from db import games as game_db
from db import user as user_db
from db.activity_log import log_activity
from schemas.games import GameOut, GamePage, GameDetail, GamePlayUpdate, GameUpdateOut
from utils.image import compress_image
from core.exceptions import NotFoundError, BadRequestError


router = APIRouter(prefix="/games", tags=["games"])


@router.get("/", response_model=GamePage)
def list_games(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    return {"items": game_db.get_all_games(db, skip=skip, limit=limit, user_id=user_id), "total": game_db.count_games(db)}


@router.post("/", response_model=GameOut, status_code=201)
def add_game(
    title: str = Form(...),
    poster_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    steam_link: str | None = Form(None),
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
        os.makedirs(GAMES_DIR, exist_ok=True)
        filename = f"{uuid.uuid4()}{ext}"
        with open(os.path.join(GAMES_DIR, filename), "wb") as f:
            f.write(data)
        poster = f"games/{filename}"
    elif poster_url:
        poster = poster_url

    game = game_db.create_game(db, title=title, poster=poster, user_id=user_id, steam_link=steam_link)
    log_activity(db, user_id=user_id, username=user.username, action="game_add", entity_title=title, entity_type="game", entity_id=game['id'])
    return game


@router.get("/steam-search")
def steam_search(
    q: str = Query(..., min_length=1, max_length=100),
    _: int = Depends(get_user_from_token),
):
    try:
        resp = httpx.get(
            "https://store.steampowered.com/api/storesearch/",
            params={"term": q, "l": "english", "cc": "US"},
            timeout=5.0,
        )
        resp.raise_for_status()
    except httpx.HTTPError:
        raise BadRequestError("Steam API недоступен")

    items = resp.json().get("items", [])
    return [
        {
            "appid": item["id"],
            "name": item["name"],
            "thumbnail": item.get("tiny_image", ""),
        }
        for item in items[:10]
        if item.get("id") and item.get("name")
    ]


@router.get("/steam-image")
def steam_image(
    appid: int = Query(...),
    _: int = Depends(get_user_from_token),
):
    payload = json.dumps({
        "ids": [{"appid": str(appid)}],
        "context": {"country_code": "US"},
        "data_request": {"include_assets": True},
    })
    try:
        resp = httpx.get(
            "https://api.steampowered.com/IStoreBrowseService/GetItems/v1/",
            params={"input_json": payload},
            timeout=5.0,
        )
        resp.raise_for_status()
    except httpx.HTTPError:
        raise BadRequestError("Steam API недоступен")

    store_items = resp.json().get("response", {}).get("store_items", [])
    if not store_items:
        raise BadRequestError("Игра не найдена")

    assets = store_items[0].get("assets", {})
    url_format = assets.get("asset_url_format", "")
    filename = assets.get("library_capsule_2x") or assets.get("library_capsule", "")

    if not url_format or not filename:
        raise BadRequestError("Нет изображения")

    cdn = "https://shared.akamai.steamstatic.com/store_item_assets/"
    cover_url = cdn + url_format.replace("${FILENAME}", filename)
    return {"cover_url": cover_url}


@router.get("/{game_id}/page-number")
def get_game_page_number(
    game_id: int,
    limit: int = Query(20),
    _: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    page = game_db.get_game_page(db, game_id, limit)
    if page is None:
        raise NotFoundError("Игра")
    return {"page": page}


@router.get("/{game_id}/detail", response_model=GameDetail)
def get_game_detail(
    game_id: int,
    _: int = Depends(get_user_from_token),
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
    user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)
    
    detail = game_db.toggle_user_played(db, game_id, user_id, rating=body.rating, review=body.review)
    if not detail:
        raise NotFoundError("Игра")
    
    user_status = next((s for s in detail['statuses'] if s['user_id'] == user_id), None)
    if user_status and user_status['is_played']:
        has_review = bool(user_status.get('review')) or user_status.get('rating') is not None
        action = "game_reviewed" if has_review else "game_played"
        log_activity(db, user_id=user_id, username=user.username, action=action, entity_title=detail['title'], entity_type="game", entity_id=game_id)
    return detail


@router.patch("/{game_id}", response_model=GameUpdateOut)
def update_game(
    game_id: int,
    title: str = Form(...),
    steam_link: str | None = Form(None),
    file: UploadFile | None = File(None),
    _: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
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
        os.makedirs(GAMES_DIR, exist_ok=True)
        filename = f"{uuid.uuid4()}{ext}"
        with open(os.path.join(GAMES_DIR, filename), "wb") as f:
            f.write(data)
        new_poster = f"games/{filename}"

    new_steam = steam_link.strip() or None if steam_link is not None else existing.steam_link

    updated = game_db.update_game(db, game_id, title=title, poster=new_poster, steam_link=new_steam)
    return updated


@router.delete("/{game_id}", status_code=204)
def delete_game(
    game_id: int,
    user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    user = user_db.get_user_by_id(db, user_id)

    game = game_db.get_game_by_id(db, game_id)
    if not game:
        raise NotFoundError("Игра")

    if game.poster and not game.poster.startswith("http"):
        path = os.path.join("uploads", game.poster)
        if os.path.exists(path):
            os.remove(path)

    log_activity(db, user_id=user_id, username=user.username, action="game_delete", entity_title=game.title)
    game_db.delete_game(db, game_id)
