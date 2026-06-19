from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserProfileOut(BaseModel):
    id: int
    username: str
    role: str
    avatar_url: str | None
    last_active: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
