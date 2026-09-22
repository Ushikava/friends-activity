"""add nya_coins to users and coin_transactions table

Revision ID: 0019
Revises: 0018
Create Date: 2026-06-25

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = '0019'
down_revision: Union[str, Sequence[str], None] = '0018'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users_data', sa.Column('nya_coins', sa.Integer(), nullable=False, server_default='0'))

    op.create_table(
        'coin_transactions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users_data.id', ondelete='CASCADE'), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_coin_transactions_user_id', 'coin_transactions', ['user_id'])
    op.create_index('ix_coin_transactions_created_at', 'coin_transactions', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_coin_transactions_created_at', table_name='coin_transactions')
    op.drop_index('ix_coin_transactions_user_id', table_name='coin_transactions')
    op.drop_table('coin_transactions')
    op.drop_column('users_data', 'nya_coins')
