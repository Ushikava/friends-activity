"""add scheduled_at to notifications

Revision ID: 0013
Revises: 0012
Create Date: 2026-06-18
"""
from alembic import op
import sqlalchemy as sa

revision = '0013'
down_revision = '0012'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('notifications', sa.Column('scheduled_at', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('notifications', 'scheduled_at')
