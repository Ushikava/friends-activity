from sqlalchemy.orm import Session

from db.models import ChatRoom, ChatMessage


def get_rooms(db: Session, user_id: int) -> list[ChatRoom]:
    return (
        db.query(ChatRoom)
        .filter(ChatRoom.user_id == user_id)
        .order_by(ChatRoom.created_at.asc())
        .all()
    )


def create_room(db: Session, user_id: int, name: str) -> ChatRoom:
    room = ChatRoom(user_id=user_id, name=name)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def get_room(db: Session, room_id: int, user_id: int) -> ChatRoom | None:
    return db.query(ChatRoom).filter(
        ChatRoom.id == room_id,
        ChatRoom.user_id == user_id,
    ).first()


def rename_room(db: Session, room_id: int, user_id: int, name: str) -> ChatRoom | None:
    room = get_room(db, room_id, user_id)
    if not room:
        return None
    room.name = name
    db.commit()
    db.refresh(room)
    return room


def delete_room(db: Session, room_id: int, user_id: int) -> bool:
    room = get_room(db, room_id, user_id)
    if not room:
        return False
    db.query(ChatMessage).filter(ChatMessage.room_id == room_id).delete()
    db.delete(room)
    db.commit()
    return True


def get_history(db: Session, room_id: int, limit: int = 50) -> list[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )


def save_message(db: Session, user_id: int, room_id: int, role: str, content: str) -> ChatMessage:
    msg = ChatMessage(user_id=user_id, room_id=room_id, role=role, content=content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def clear_history(db: Session, room_id: int, user_id: int) -> None:
    room = get_room(db, room_id, user_id)
    if room:
        db.query(ChatMessage).filter(ChatMessage.room_id == room_id).delete()
        db.commit()
