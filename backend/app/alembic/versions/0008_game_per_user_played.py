"""game per-user played tracking"""

revision = '0008'
down_revision = '0007'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


def upgrade():
    op.create_table(
        'game_plays',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('game_id', sa.Integer(), sa.ForeignKey('games.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users_data.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_played', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('review', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.UniqueConstraint('game_id', 'user_id', name='uq_game_user_play'),
    )

    conn = op.get_bind()
    conn.execute(text("""
        INSERT INTO game_plays (game_id, user_id, is_played, updated_at)
        SELECT g.id, u.id, g.is_played, NOW()
        FROM games g CROSS JOIN users_data u
        WHERE u.role != 'observer'
        ON CONFLICT (game_id, user_id) DO NOTHING
    """))

    op.drop_column('games', 'is_played')


def downgrade():
    op.add_column('games', sa.Column('is_played', sa.Boolean(), nullable=False, server_default='false'))
    conn = op.get_bind()
    conn.execute(text("""
        UPDATE games g
        SET is_played = (
            SELECT COALESCE(bool_or(gw.is_played), false)
            FROM game_plays gw WHERE gw.game_id = g.id
        )
    """))
    op.drop_table('game_plays')
