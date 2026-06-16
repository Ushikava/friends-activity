import json

import httpx
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from core.auth import require_not_observer
from core.exceptions import NotFoundError
from core.settings import OLLAMA_URL, OLLAMA_MODEL
from db.session import get_db, SessionLocal
from db import chat as chat_db
from schemas.chat import ChatRoomOut, ChatRoomCreate, ChatRoomRename, ChatMessageOut, ChatRequest

router = APIRouter(tags=["chat"])

CONTEXT_MESSAGES = 20


@router.get("/chat/rooms", response_model=list[ChatRoomOut])
def list_rooms(db: Session = Depends(get_db), user_id: int = Depends(require_not_observer)):
    return chat_db.get_rooms(db, user_id)


@router.post("/chat/rooms", response_model=ChatRoomOut, status_code=201)
def create_room(body: ChatRoomCreate, db: Session = Depends(get_db), user_id: int = Depends(require_not_observer)):
    return chat_db.create_room(db, user_id, body.name)


@router.patch("/chat/rooms/{room_id}", response_model=ChatRoomOut)
def rename_room(room_id: int, body: ChatRoomRename, db: Session = Depends(get_db), user_id: int = Depends(require_not_observer)):
    room = chat_db.rename_room(db, room_id, user_id, body.name)
    if not room:
        raise NotFoundError("Комната")
    return room


@router.delete("/chat/rooms/{room_id}", status_code=204)
def delete_room(room_id: int, db: Session = Depends(get_db), user_id: int = Depends(require_not_observer)):
    if not chat_db.delete_room(db, room_id, user_id):
        raise NotFoundError("Комната")


@router.get("/chat/rooms/{room_id}/history", response_model=list[ChatMessageOut])
def get_history(room_id: int, db: Session = Depends(get_db), user_id: int = Depends(require_not_observer)):
    if not chat_db.get_room(db, room_id, user_id):
        raise NotFoundError("Комната")
    return chat_db.get_history(db, room_id)


@router.delete("/chat/rooms/{room_id}/history", status_code=204)
def clear_history(room_id: int, db: Session = Depends(get_db), user_id: int = Depends(require_not_observer)):
    if not chat_db.get_room(db, room_id, user_id):
        raise NotFoundError("Комната")
    chat_db.clear_history(db, room_id, user_id)


@router.post("/chat/rooms/{room_id}/send")
async def send_message(
    room_id: int,
    body: ChatRequest,
    user_id: int = Depends(require_not_observer),
):
    # DB session closed before stream starts to avoid holding the connection
    # during the long Ollama streaming response
    db = SessionLocal()
    try:
        if not chat_db.get_room(db, room_id, user_id):
            raise NotFoundError("Комната")
        chat_db.save_message(db, user_id, room_id, "user", body.message)
        history = chat_db.get_history(db, room_id, limit=CONTEXT_MESSAGES)
        messages = [{"role": m.role, "content": m.content} for m in history]
    finally:
        db.close()

    async def stream():
        full_response = []
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_URL}/api/chat",
                    json={"model": OLLAMA_MODEL, "messages": messages, "stream": True},
                ) as resp:
                    async for line in resp.aiter_lines():
                        if not line:
                            continue
                        try:
                            chunk = json.loads(line)
                        except json.JSONDecodeError:
                            continue
                        token = chunk.get("message", {}).get("content", "")
                        if token:
                            full_response.append(token)
                            yield f"data: {json.dumps({'content': token})}\n\n"
                        if chunk.get("done"):
                            break
        except (httpx.ConnectError, httpx.TimeoutException, httpx.RemoteProtocolError, httpx.HTTPStatusError):
            yield f"data: {json.dumps({'error': 'model_unavailable'})}\n\n"
        finally:
            if full_response:
                db2 = SessionLocal()
                try:
                    chat_db.save_message(db2, user_id, room_id, "assistant", "".join(full_response))
                finally:
                    db2.close()
            yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
