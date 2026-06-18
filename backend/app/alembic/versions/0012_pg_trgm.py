"""enable pg_trgm and gin indexes for fuzzy title search

Revision ID: 0012
Revises: 0011
Create Date: 2026-06-18
"""
from alembic import op

revision = '0012'
down_revision = '0011'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("CREATE INDEX IF NOT EXISTS movies_title_trgm ON movies USING gin (title gin_trgm_ops)")
    op.execute("CREATE INDEX IF NOT EXISTS games_title_trgm ON games USING gin (title gin_trgm_ops)")


def downgrade():
    op.execute("DROP INDEX IF EXISTS games_title_trgm")
    op.execute("DROP INDEX IF EXISTS movies_title_trgm")
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
