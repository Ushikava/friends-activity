from datetime import timezone, datetime

from fastapi import APIRouter
from passlib.context import CryptContext

from core.auth import create_access_token, create_refresh_token, get_user_from_token
from db.session import SessionLocal
from db import user as user_db
from schemas.user import LoginRequest, RefreshRequest, TokenResponse
from core.exceptions import UnauthorizedError

pwd_context = CryptContext(schemes=["bcrypt"])

router = APIRouter(tags=["auth"])


@router.get("/users")
def list_users():
    db = SessionLocal()
    try:
        from db.models import UserData
        users = db.query(UserData.username, UserData.role).all()
        return [{"username": u.username, "role": u.role} for u in users]
    finally:
        db.close()


@router.post("/login", response_model=TokenResponse)
def user_login(body: LoginRequest):
    db = SessionLocal()
    try:
        user = user_db.get_user_by_username(db, body.username)
        if not user or not pwd_context.verify(body.password, user.hashed_password):
            raise UnauthorizedError("Неверные учетные данные")

        access_token = create_access_token(user.id, user.username)
        refresh_token, expires_at = create_refresh_token()
        user_db.save_refresh_token(db, user.id, refresh_token, expires_at)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            username=user.username,
            role=user.role,
        )
    finally:
        db.close()


@router.post("/refresh")
def refresh_token(body: RefreshRequest):
    db = SessionLocal()
    try:
        rt = user_db.get_refresh_token(db, body.refresh_token)
        if not rt:
            raise UnauthorizedError("Недействительный refresh token")
        if rt.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            user_db.delete_refresh_token(db, body.refresh_token)
            raise UnauthorizedError("Refresh token истёк")

        user = user_db.get_user_by_id(db, rt.user_id)
        if not user:
            raise UnauthorizedError("Пользователь не найден")

        user_db.delete_refresh_token(db, body.refresh_token)

        access_token = create_access_token(user.id, user.username)
        new_refresh_token, expires_at = create_refresh_token()
        user_db.save_refresh_token(db, user.id, new_refresh_token, expires_at)

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            username=user.username,
            role=user.role,
        )
    finally:
        db.close()


@router.post("/logout")
def logout(body: RefreshRequest):
    db = SessionLocal()
    try:
        user_db.delete_refresh_token(db, body.refresh_token)
        return {"status": "ok"}
    finally:
        db.close()
