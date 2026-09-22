"""add shop_purchases table for the nya coins shop

Revision ID: 0021
Revises: 0020
Create Date: 2026-09-23

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = '0021'
down_revision: Union[str, Sequence[str], None] = '0020'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'shop_purchases',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users_data.id', ondelete='CASCADE'), nullable=False),
        sa.Column('item_id', sa.String(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_shop_purchases_user_id', 'shop_purchases', ['user_id'])
    op.create_unique_constraint('uq_shop_purchase_user_item', 'shop_purchases', ['user_id', 'item_id'])


def downgrade() -> None:
    op.drop_constraint('uq_shop_purchase_user_item', 'shop_purchases', type_='unique')
    op.drop_index('ix_shop_purchases_user_id', table_name='shop_purchases')
    op.drop_table('shop_purchases')
