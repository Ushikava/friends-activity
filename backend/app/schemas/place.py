from datetime import datetime
from pydantic import BaseModel


class PlaceOut(BaseModel):
    id: int
    filename: str
    description: str | None
    uploaded_by: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


class PlacePage(BaseModel):
    items: list[PlaceOut]
    total: int
