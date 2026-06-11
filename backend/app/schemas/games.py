from datetime import datetime
from pydantic import BaseModel


class GameOut(BaseModel):
    id: int
    title: str
    poster: str | None
    is_played: bool
    steam_link: str | None
    added_by: int
    created_at: datetime

    class Config:
        from_attributes = True
