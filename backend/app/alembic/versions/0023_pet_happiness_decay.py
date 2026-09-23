"""add happiness_updated_at anchor for lazy happiness decay

Revision ID: 0023
Revises: 0022
Create Date: 2026-09-23

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = '0023'
down_revision: Union[str, Sequence[str], None] = '0022'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('pet_state', sa.Column('happiness_updated_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('pet_state', 'happiness_updated_at')
