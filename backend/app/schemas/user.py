from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    username: str
    role: str


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    avatar_url: str | None

    class Config:
        from_attributes = True
