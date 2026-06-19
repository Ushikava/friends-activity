from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


class WishlistItemOut(BaseModel):
    id: int
    title: str = Field(validation_alias='wish_name')
    url: str = Field(validation_alias='wish_url')
    price: float | None
    currency: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class WishlistItemCreate(BaseModel):
    title: str
    url: str
    price: float | None = None
    currency: str = "RUB"
