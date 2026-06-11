"""add movies

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-09
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "movies",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("poster", sa.Text, nullable=True),
        sa.Column("is_watched", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("added_by", sa.Integer, sa.ForeignKey("users_data.id"), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    op.drop_table("movies")
