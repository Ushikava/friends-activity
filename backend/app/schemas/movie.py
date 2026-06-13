from datetime import datetime

from pydantic import BaseModel


class MovieOut(BaseModel):
    id: int
    title: str
    poster: str | None
    watch_count: int
    user_count: int
    is_watched_by_me: bool
    added_by: int
    created_at: datetime

    model_config = {'from_attributes': True}


class MoviePage(BaseModel):
    items: list[MovieOut]
    total: int


class MovieWatchUpdate(BaseModel):
    rating: int | None = None
    review: str | None = None


class MovieUserStatus(BaseModel):
    user_id: int
    username: str
    is_watched: bool
    rating: int | None
    review: str | None


class MovieDetail(BaseModel):
    id: int
    title: str
    poster: str | None
    created_at: datetime
    statuses: list[MovieUserStatus]
