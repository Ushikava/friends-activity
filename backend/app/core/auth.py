import datetime
import secrets
from typing import Dict, Optional, Tuple

import jwt
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.settings import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from core.exceptions import UnauthorizedError

REFRESH_TOKEN_EXPIRE_DAYS = 30

oauth2_scheme = HTTPBearer()
oauth2_scheme_optional = HTTPBearer(auto_error=False)


def create_access_token(user_id: int, username: str, role: str = "user") -> str:
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "username": username, "role": role, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token() -> Tuple[str, datetime.datetime]:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return token, expires_at


def _decode_token(credentials: HTTPAuthorizationCredentials) -> dict:
    try:
        return jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError("Токен истёк")
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise UnauthorizedError("Недействительный токен")


def get_user_from_token(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)) -> int:
    payload = _decode_token(credentials)
    return int(payload.get("sub"))


def require_not_observer(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)) -> int:
    from core.exceptions import ForbiddenError
    payload = _decode_token(credentials)
    if payload.get("role") == "observer":
        raise ForbiddenError("Доступ запрещён")
    return int(payload.get("sub"))


def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(oauth2_scheme_optional)) -> Optional[int]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("sub"))
    except Exception:
        return None
