"""add favorites table

Revision ID: 0014
Revises: 0013
Create Date: 2026-06-18
"""
from alembic import op
import sqlalchemy as sa

revision = '0014'
down_revision = '0013'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'favorites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users_data.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'entity_type', 'entity_id', name='uq_favorites'),
    )
    op.create_index('ix_favorites_user_type', 'favorites', ['user_id', 'entity_type'])


def downgrade():
    op.drop_table('favorites')
