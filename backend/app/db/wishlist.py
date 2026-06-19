from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from db.models import Whishlist


def create_wishlist_item(db: Session, 
                         wish_name: str, 
                         wish_url: str, 
                         user_id: int, 
                         price: float | None, 
                         currency: str) -> Whishlist:
    wishlist_item = Whishlist(
        wish_name=wish_name,
        wish_url=wish_url,
        user_id=user_id,
        price=price,
        currency=currency,
    )
    db.add(wishlist_item)
    db.commit()
    db.refresh(wishlist_item)
    return wishlist_item


def get_wishlist_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 40,
) -> tuple[list[Whishlist], int]:
    query = db.query(Whishlist).filter(Whishlist.user_id == user_id).order_by(Whishlist.created_at.desc())
    total: int = query.count()
    wishlist_items = query.offset(skip).limit(limit).all()
    return wishlist_items, total


def count_wishlist_items(db: Session) -> int:
    return db.query(func.count(Whishlist.id)).scalar()


def get_wishlist_item_by_id(db: Session, wish_id: int) -> Whishlist | None:
    return db.query(Whishlist).filter(Whishlist.id == wish_id).first()


def delete_wishlist_item(db: Session, wish_id: int, user_id: int) -> None:
    db.query(Whishlist).filter(Whishlist.id == wish_id, Whishlist.user_id == user_id).delete()
    db.commit()
