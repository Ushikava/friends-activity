"""add places

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-10
"""

from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "places",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("filename", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("uploaded_by", sa.Integer, sa.ForeignKey("users_data.id"), nullable=False),
        sa.Column("uploaded_at", sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    op.drop_table("places")
