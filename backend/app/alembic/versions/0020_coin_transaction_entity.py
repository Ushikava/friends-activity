"""add entity_type/entity_id to coin_transactions for per-entity dedup

Revision ID: 0020
Revises: 0019
Create Date: 2026-09-22

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = '0020'
down_revision: Union[str, Sequence[str], None] = '0019'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('coin_transactions', sa.Column('entity_type', sa.String(), nullable=True))
    op.add_column('coin_transactions', sa.Column('entity_id', sa.Integer(), nullable=True))
    op.create_index(
        'ix_coin_transactions_entity',
        'coin_transactions',
        ['user_id', 'entity_type', 'entity_id'],
    )


def downgrade() -> None:
    op.drop_index('ix_coin_transactions_entity', table_name='coin_transactions')
    op.drop_column('coin_transactions', 'entity_id')
    op.drop_column('coin_transactions', 'entity_type')
