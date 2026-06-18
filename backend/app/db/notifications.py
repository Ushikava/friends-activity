from sqlalchemy.orm import Session

from db.models import Notification


def create_notification(
    db: Session,
    sender_id: int,
    sender_username: str,
    recipient_id: int,
    entity_type: str,
    entity_id: int,
    entity_title: str,
) -> Notification:
    n = Notification(
        sender_id=sender_id,
        sender_username=sender_username,
        recipient_id=recipient_id,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_title=entity_title,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def get_my_notifications(db: Session, user_id: int) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.recipient_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )


def get_unread_count(db: Session, user_id: int) -> int:
    return (
        db.query(Notification)
        .filter(Notification.recipient_id == user_id, Notification.is_read.is_(False))
        .count()
    )


def mark_read(db: Session, notification_id: int, user_id: int) -> Notification | None:
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == user_id,
    ).first()
    if n:
        n.is_read = True
        db.commit()
        db.refresh(n)
    return n


def mark_all_read(db: Session, user_id: int) -> None:
    db.query(Notification).filter(
        Notification.recipient_id == user_id,
        Notification.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()


def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == user_id,
    ).first()
    if n:
        db.delete(n)
        db.commit()
        return True
    return False
