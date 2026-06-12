"""add chat rooms

Revision ID: 0006
Revises: 0005
Create Date: 2025-06-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'chat_rooms',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users_data.id'), nullable=False),
        sa.Column('name', sa.String(), nullable=False, server_default='Новый чат'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    # Add room_id nullable first so existing rows don't violate constraint
    op.add_column('chat_messages', sa.Column('room_id', sa.Integer(), nullable=True))

    # For each user who has messages, create a default room and assign their messages
    conn = op.get_bind()
    users_with_messages = conn.execute(
        text("SELECT DISTINCT user_id FROM chat_messages")
    ).fetchall()

    for (uid,) in users_with_messages:
        result = conn.execute(
            text(
                "INSERT INTO chat_rooms (user_id, name, created_at) "
                "VALUES (:uid, 'Общий', NOW()) RETURNING id"
            ),
            {"uid": uid},
        )
        room_id = result.fetchone()[0]
        conn.execute(
            text("UPDATE chat_messages SET room_id = :rid WHERE user_id = :uid AND room_id IS NULL"),
            {"rid": room_id, "uid": uid},
        )

    # Delete orphaned messages (shouldn't exist, but just in case)
    conn.execute(text("DELETE FROM chat_messages WHERE room_id IS NULL"))

    op.alter_column('chat_messages', 'room_id', nullable=False)
    op.create_foreign_key(
        'fk_chat_messages_room_id',
        'chat_messages', 'chat_rooms',
        ['room_id'], ['id'],
    )


def downgrade():
    op.drop_constraint('fk_chat_messages_room_id', 'chat_messages', type_='foreignkey')
    op.drop_column('chat_messages', 'room_id')
    op.drop_table('chat_rooms')
