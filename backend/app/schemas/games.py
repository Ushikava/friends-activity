from datetime import datetime

from pydantic import BaseModel


class GameOut(BaseModel):
    id: int
    title: str
    poster: str | None
    steam_link: str | None
    play_count: int
    user_count: int
    is_played_by_me: bool
    is_favorite: bool = False
    added_by: int
    created_at: datetime

    model_config = {'from_attributes': True}


class GamePage(BaseModel):
    items: list[GameOut]
    total: int


class GamePlayUpdate(BaseModel):
    rating: int | None = None
    review: str | None = None


class GameUserStatus(BaseModel):
    user_id: int
    username: str
    is_played: bool
    rating: int | None
    review: str | None


class GameDetail(BaseModel):
    id: int
    title: str
    poster: str | None
    steam_link: str | None
    created_at: datetime
    statuses: list[GameUserStatus]


class GameUpdateOut(BaseModel):
    id: int
    title: str
    poster: str | None
    steam_link: str | None
