"""add pet_state table for the tamagotchi cat

Revision ID: 0022
Revises: 0021
Create Date: 2026-09-23

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = '0022'
down_revision: Union[str, Sequence[str], None] = '0021'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'pet_state',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users_data.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(), nullable=False, server_default='Котик'),
        sa.Column('adopted_at', sa.DateTime(), nullable=True),
        sa.Column('satiety', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('satiety_updated_at', sa.DateTime(), nullable=True),
        sa.Column('happiness', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('active_environment_item_id', sa.String(), nullable=True),
    )
    op.create_unique_constraint('uq_pet_state_user_id', 'pet_state', ['user_id'])


def downgrade() -> None:
    op.drop_constraint('uq_pet_state_user_id', 'pet_state', type_='unique')
    op.drop_table('pet_state')
