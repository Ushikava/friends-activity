from datetime import datetime

from pydantic import BaseModel


class ChatRoomOut(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRoomCreate(BaseModel):
    name: str = "Новый чат"


class ChatRoomRename(BaseModel):
    name: str


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str
