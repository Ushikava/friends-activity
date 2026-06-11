"""initial

Revision ID: 0001
Revises:
Create Date: 2026-06-09
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users_data",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("username", sa.String, nullable=False, unique=True),
        sa.Column("hashed_password", sa.Text, nullable=False),
        sa.Column("role", sa.String, nullable=False, server_default="user"),
        sa.Column("avatar_url", sa.String, nullable=True),
    )

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users_data.id"), nullable=False),
        sa.Column("token", sa.String, nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "photos",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("filename", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("uploaded_by", sa.Integer, sa.ForeignKey("users_data.id"), nullable=False),
        sa.Column("uploaded_at", sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    op.drop_table("photos")
    op.drop_table("refresh_tokens")
    op.drop_table("users_data")
