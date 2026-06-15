from sqlalchemy.orm import Session

from db.models import ActivityLog


def log_activity(
    db: Session,
    user_id: int | None,
    username: str | None,
    action: str,
    entity_title: str | None = None,
) -> None:
    db.add(ActivityLog(user_id=user_id, username=username, action=action, entity_title=entity_title))
    db.commit()


def get_feed(db: Session, limit: int = 50) -> list[dict]:
    rows = (
        db.query(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "username": r.username,
            "action": r.action,
            "entity_title": r.entity_title,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
