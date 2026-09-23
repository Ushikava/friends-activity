from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.auth import get_user_from_token, require_not_observer
from core.exceptions import BadRequestError
from db.session import get_db
from db.coins import get_balance
from db.shop import SHOP_ITEMS, CATEGORIES, get_inventory, purchase_item

router = APIRouter(prefix="/shop", tags=["shop"])

ERROR_MESSAGES = {
    "purchases_disabled": "Покупка не может быть завершена",
    "unknown_item": "Неизвестный товар",
    "already_owned": "У тебя уже это есть",
    "insufficient_coins": "Недостаточно ня-коинов",
}


@router.get("/items")
def list_items(user_id: int = Depends(get_user_from_token), db: Session = Depends(get_db)):
    inventory = get_inventory(db, user_id)
    return {
        "categories": CATEGORIES,
        "items": [
            {
                "id": item.id,
                "category": item.category,
                "name_ru": item.name_ru,
                "name_en": item.name_en,
                "price": item.price,
                "icon": item.icon,
                "image": item.image,
                "owned": inventory.get(item.id, 0) > 0,
                "quantity": inventory.get(item.id, 0),
            }
            for item in SHOP_ITEMS.values()
        ],
    }


@router.post("/purchase/{item_id}")
def buy_item(item_id: str, user_id: int = Depends(require_not_observer), db: Session = Depends(get_db)):
    ok, error = purchase_item(db, user_id, item_id)
    if not ok:
        raise BadRequestError(ERROR_MESSAGES.get(error, error))


    inventory = get_inventory(db, user_id)
    return {
        "balance": get_balance(db, user_id),
        "item_id": item_id,
        "quantity": inventory.get(item_id, 0),
    }
