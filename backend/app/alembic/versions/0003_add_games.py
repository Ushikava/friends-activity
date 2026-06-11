"""add games

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-10
"""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "games",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("poster", sa.Text, nullable=True),
        sa.Column("is_played", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("steam_link", sa.Text, nullable=True),
        sa.Column("added_by", sa.Integer, sa.ForeignKey("users_data.id"), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    op.drop_table("games")
