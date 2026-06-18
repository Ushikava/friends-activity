from datetime import datetime

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.auth import get_user_from_token, require_not_observer
from core.exceptions import NotFoundError, BadRequestError
from db.session import get_db
from db import notifications as notif_db
from db import user as user_db

router = APIRouter(prefix="/notifications", tags=["notifications"])


class SendNotificationBody(BaseModel):
    recipient_id: int
    entity_type: str   # "movie" | "game"
    entity_id: int
    entity_title: str
    scheduled_at: datetime | None = None


@router.post("/", status_code=201)
def send_notification(
    body: SendNotificationBody,
    sender_id: int = Depends(require_not_observer),
    db: Session = Depends(get_db),
):
    if body.entity_type not in ("movie", "game"):
        raise BadRequestError("Неверный тип сущности")
    if body.recipient_id == sender_id:
        raise BadRequestError("Нельзя отправить уведомление самому себе")
    recipient = user_db.get_user_by_id(db, body.recipient_id)
    if not recipient:
        raise NotFoundError("Пользователь")
    sender = user_db.get_user_by_id(db, sender_id)
    notif_db.create_notification(
        db,
        sender_id=sender_id,
        sender_username=sender.username,
        recipient_id=body.recipient_id,
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        entity_title=body.entity_title,
        scheduled_at=body.scheduled_at,
    )
    return {"ok": True}


@router.get("/")
def get_notifications(
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    items = notif_db.get_my_notifications(db, user_id)
    return [
        {
            "id": n.id,
            "sender_username": n.sender_username,
            "entity_type": n.entity_type,
            "entity_id": n.entity_id,
            "entity_title": n.entity_title,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "scheduled_at": n.scheduled_at.isoformat() if n.scheduled_at else None,
        }
        for n in items
    ]


@router.get("/count")
def get_unread_count(
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    return {"count": notif_db.get_unread_count(db, user_id)}


@router.patch("/{notification_id}/read", status_code=200)
def mark_read(
    notification_id: int,
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    n = notif_db.mark_read(db, notification_id, user_id)
    if not n:
        raise NotFoundError("Уведомление")
    return {"ok": True}


@router.post("/read-all", status_code=200)
def mark_all_read(
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    notif_db.mark_all_read(db, user_id)
    return {"ok": True}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db),
):
    if not notif_db.delete_notification(db, notification_id, user_id):
        raise NotFoundError("Уведомление")
