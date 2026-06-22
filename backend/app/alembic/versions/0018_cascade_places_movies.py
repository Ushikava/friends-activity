"""add cascade delete for places and movies

Revision ID: 0018
Revises: 0017
Create Date: 2026-06-22

"""
from typing import Sequence, Union
from alembic import op

revision: str = '0018'
down_revision: Union[str, Sequence[str], None] = '0017'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('places_uploaded_by_fkey', 'places', type_='foreignkey')
    op.create_foreign_key(None, 'places', 'users_data', ['uploaded_by'], ['id'], ondelete='CASCADE')

    op.drop_constraint('movies_added_by_fkey', 'movies', type_='foreignkey')
    op.create_foreign_key(None, 'movies', 'users_data', ['added_by'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    op.drop_constraint(None, 'movies', type_='foreignkey')
    op.create_foreign_key('movies_added_by_fkey', 'movies', 'users_data', ['added_by'], ['id'])

    op.drop_constraint(None, 'places', type_='foreignkey')
    op.create_foreign_key('places_uploaded_by_fkey', 'places', 'users_data', ['uploaded_by'], ['id'])
