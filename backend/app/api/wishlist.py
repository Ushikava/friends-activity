from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.auth import require_not_observer
from db.session import get_db
from db import wishlist as wishlist_db
from schemas.wishlist import WishlistItemCreate, WishlistItemOut
from core.exceptions import NotFoundError


router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("/", response_model=list[WishlistItemOut])
def list_wishlist_items(
    view_user_id: int | None = Query(None, alias="user_id"),
    current_user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    target_id = view_user_id if view_user_id is not None else current_user_id
    items, _ = wishlist_db.get_wishlist_by_user(db, user_id=target_id)
    return items


@router.post("/", response_model=WishlistItemOut, status_code=201)
def create_wishlist_item(
    item: WishlistItemCreate,
    user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    wish = wishlist_db.create_wishlist_item(
        db,
        wish_name=item.title,
        wish_url=item.url,
        price=item.price,
        currency=item.currency,
        user_id=user_id,
    )
    return wish


@router.delete("/{wish_id}", status_code=204)
def delete_wishlist_item(
    wish_id: int,
    user_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    wish = wishlist_db.get_wishlist_item_by_id(db, wish_id)
    if not wish or wish.user_id != user_id:
        raise NotFoundError("Позиция в списке желаемого")
    wishlist_db.delete_wishlist_item(db, wish_id, user_id)


