from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.auth import require_not_observer
from core.exceptions import NotFoundError, BadRequestError
from db.session import get_db
from db import pet as pet_db

router = APIRouter(prefix="/pet", tags=["pet"])

ERROR_MESSAGES = {
    "no_pet": "Питомец ещё не заведён",
    "unknown_item": "Неизвестный предмет",
    "not_owned": "Этого предмета нет в инвентаре",
}


class RenameBody(BaseModel):
    name: str


class EnvironmentBody(BaseModel):
    item_id: str | None = None


@router.get("/")
def get_pet(user_id: int = Depends(require_not_observer), db: Session = Depends(get_db)):
    view = pet_db.get_pet_view(db, user_id)
    if not view and pet_db.has_adopted_but_no_pet(db, user_id):
        pet_db.create_pet_if_needed(db, user_id)
        view = pet_db.get_pet_view(db, user_id)
    if not view:
        raise NotFoundError("Питомец")
    return view


@router.post("/feed/{item_id}")
def feed(item_id: str, user_id: int = Depends(require_not_observer), db: Session = Depends(get_db)):
    ok, error = pet_db.feed_pet(db, user_id, item_id)
    if not ok:
        raise BadRequestError(ERROR_MESSAGES.get(error, error))
    return pet_db.get_pet_view(db, user_id)


@router.post("/play/{item_id}")
def play(item_id: str, user_id: int = Depends(require_not_observer), db: Session = Depends(get_db)):
    ok, error = pet_db.play_with_pet(db, user_id, item_id)
    if not ok:
        raise BadRequestError(ERROR_MESSAGES.get(error, error))
    return pet_db.get_pet_view(db, user_id)


@router.patch("/environment")
def environment(body: EnvironmentBody, user_id: int = Depends(require_not_observer), db: Session = Depends(get_db)):
    ok, error = pet_db.set_environment(db, user_id, body.item_id)
    if not ok:
        raise BadRequestError(ERROR_MESSAGES.get(error, error))
    return pet_db.get_pet_view(db, user_id)


@router.patch("/name")
def rename(body: RenameBody, user_id: int = Depends(require_not_observer), db: Session = Depends(get_db)):
    if not body.name.strip():
        raise BadRequestError("Имя не может быть пустым")
    pet = pet_db.rename_pet(db, user_id, body.name)
    if not pet:
        raise NotFoundError("Питомец")
    return pet_db.get_pet_view(db, user_id)
