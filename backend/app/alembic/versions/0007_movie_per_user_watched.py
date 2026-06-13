"""add per-user movie watched tracking

Revision ID: 0007
Revises: 0006
Create Date: 2026-06-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'movie_watches',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('movie_id', sa.Integer(), sa.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users_data.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_watched', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('review', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.UniqueConstraint('movie_id', 'user_id', name='uq_movie_user_watch'),
    )

    conn = op.get_bind()
    # Migrate: for each (movie, non-observer user) pair, copy the old global is_watched value
    conn.execute(text("""
        INSERT INTO movie_watches (movie_id, user_id, is_watched, updated_at)
        SELECT m.id, u.id, m.is_watched, NOW()
        FROM movies m
        CROSS JOIN users_data u
        WHERE u.role != 'observer'
        ON CONFLICT (movie_id, user_id) DO NOTHING
    """))

    op.drop_column('movies', 'is_watched')


def downgrade():
    op.add_column('movies', sa.Column('is_watched', sa.Boolean(), nullable=False, server_default='false'))
    conn = op.get_bind()
    # Restore: mark movie as watched if any user has watched it
    conn.execute(text("""
        UPDATE movies SET is_watched = true
        WHERE id IN (
            SELECT DISTINCT movie_id FROM movie_watches WHERE is_watched = true
        )
    """))
    op.drop_table('movie_watches')
