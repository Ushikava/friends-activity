from sqlalchemy import text
from sqlalchemy.orm import Session

from db.models import ActivityLog

STACKABLE = (
    'photo_upload', 'photo_delete',
    'place_upload', 'place_delete',
    'movie_add',    'movie_delete',
    'game_add',     'game_delete',
)


def log_activity(
    db: Session,
    user_id: int | None,
    username: str | None,
    action: str,
    entity_title: str | None = None,
    entity_type: str | None = None,
    entity_id: int | None = None,
) -> None:
    db.add(ActivityLog(
        user_id=user_id, username=username, action=action,
        entity_title=entity_title, entity_type=entity_type, entity_id=entity_id,
    ))
    db.commit()


def get_feed(db: Session, limit: int = 15) -> list[dict]:
    placeholders = ', '.join(f"'{a}'" for a in STACKABLE)
    sql = text(f"""
        WITH grouped AS (
            SELECT MAX(id)           AS id,
                   username,
                   action,
                   MAX(entity_title) AS entity_title,
                   MAX(entity_type)  AS entity_type,
                   MAX(entity_id)    AS entity_id,
                   COUNT(*)          AS count,
                   MAX(created_at)   AS created_at
            FROM   activity_log
            WHERE  action IN ({placeholders})
            GROUP  BY username, action, DATE(created_at)

            UNION ALL

            SELECT id, username, action, entity_title, entity_type, entity_id, 1 AS count, created_at
            FROM   activity_log
            WHERE  action NOT IN ({placeholders})
        )
        SELECT * FROM grouped
        ORDER  BY created_at DESC
        LIMIT  :limit
    """)
    rows = db.execute(sql, {"limit": limit}).mappings().all()
    return [
        {
            "id": r["id"],
            "username": r["username"],
            "action": r["action"],
            "entity_title": r["entity_title"],
            "entity_type": r["entity_type"],
            "entity_id": r["entity_id"],
            "count": r["count"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
        }
        for r in rows
    ]
