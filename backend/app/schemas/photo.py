from datetime import datetime

from pydantic import BaseModel


class PhotoOut(BaseModel):
    id: int
    filename: str
    description: str | None
    uploaded_by: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


class PhotoCreate(BaseModel):
    description: str | None = None
