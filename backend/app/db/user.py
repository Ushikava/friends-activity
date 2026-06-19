from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from db.models import UserData, RefreshToken, ActivityLog


def get_user_by_username(db: Session, username: str):
    return db.query(UserData).filter(UserData.username == username).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(UserData).filter(UserData.id == user_id).first()


def save_refresh_token(db: Session, user_id: int, token: str, expires_at: datetime, current_date: datetime):
    rt = RefreshToken(user_id=user_id, token=token, expires_at=expires_at)
    db.add(rt)
    db.query(RefreshToken).filter(RefreshToken.expires_at <= current_date).delete()
    db.commit()


def get_refresh_token(db: Session, token: str):
    return db.query(RefreshToken).filter(RefreshToken.token == token).first()


def delete_refresh_token(db: Session, token: str):
    db.query(RefreshToken).filter(RefreshToken.token == token).delete()
    db.commit()


def delete_all_refresh_tokens(db: Session, user_id: int):
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
    db.commit()


def update_username(db: Session, user_id: int, new_username: str) -> UserData:
    user = get_user_by_id(db, user_id)
    user.username = new_username
    db.commit()
    db.refresh(user)
    return user


def update_password(db: Session, user_id: int, new_hashed_password: str) -> None:
    user = get_user_by_id(db, user_id)
    user.hashed_password = new_hashed_password
    db.commit()


def delete_user(db: Session, user_id: int) -> None:
    delete_all_refresh_tokens(db, user_id)
    db.query(UserData).filter(UserData.id == user_id).delete()
    db.commit()


def create_user(db: Session, username: str, hashed_password: str) -> UserData:
    user = UserData(username=username, hashed_password=hashed_password, role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_avatar_url(db: Session, user_id: int, avatar_url: str) -> UserData:
    user = get_user_by_id(db, user_id)
    user.avatar_url = avatar_url
    db.commit()
    db.refresh(user)
    return user


def get_all_users(db: Session) -> list[dict]:
    last_sq = (
        db.query(ActivityLog.user_id, func.max(ActivityLog.created_at).label("last_active"))
        .group_by(ActivityLog.user_id)
        .subquery()
    )
    rows = (
        db.query(UserData, last_sq.c.last_active)
        .outerjoin(last_sq, UserData.id == last_sq.c.user_id)
        .filter(UserData.role != "observer")
        .order_by(UserData.username)
        .all()
    )
    return [
        {
            "id": u.id,
            "username": u.username,
            "role": u.role,
            "avatar_url": u.avatar_url,
            "last_active": last_active,
        }
        for u, last_active in rows
    ]
