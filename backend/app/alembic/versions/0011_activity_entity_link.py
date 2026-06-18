"""add entity_id and entity_type to activity_log"""

revision = '0011'
down_revision = '0010'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('activity_log', sa.Column('entity_type', sa.String(), nullable=True))
    op.add_column('activity_log', sa.Column('entity_id', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('activity_log', 'entity_id')
    op.drop_column('activity_log', 'entity_type')
