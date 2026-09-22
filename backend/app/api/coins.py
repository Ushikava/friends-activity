from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.auth import get_user_from_token
from db.session import get_db
from db.coins import get_balance, get_transactions, COIN_REWARDS

router = APIRouter(prefix="/coins", tags=["coins"])


@router.get("/balance")
def balance(user_id: int = Depends(get_user_from_token), db: Session = Depends(get_db)):
    return {"balance": get_balance(db, user_id)}


@router.get("/transactions")
def transactions(user_id: int = Depends(get_user_from_token), db: Session = Depends(get_db)):
    rows = get_transactions(db, user_id, limit=30)
    return [
        {"id": r.id, "amount": r.amount, "reason": r.reason, "created_at": r.created_at}
        for r in rows
    ]


@router.get("/rewards")
def rewards(_: int = Depends(get_user_from_token)):
    return COIN_REWARDS
