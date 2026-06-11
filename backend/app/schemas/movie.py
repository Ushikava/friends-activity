from datetime import datetime
from pydantic import BaseModel


class MovieOut(BaseModel):
    id: int
    title: str
    poster: str | None
    is_watched: bool
    added_by: int
    created_at: datetime

    class Config:
        from_attributes = True
