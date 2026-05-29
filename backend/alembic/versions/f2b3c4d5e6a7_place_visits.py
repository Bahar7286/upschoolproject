"""place_visits — co-visit öneri sistemi

Revision ID: f2b3c4d5e6a7
Revises: e7f8a9b0c1d2
Create Date: 2026-05-28
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.db.migration_utils import has_table

revision: str = 'f2b3c4d5e6a7'
down_revision: Union[str, None] = 'e7f8a9b0c1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_table('place_visits'):
        return
    op.create_table(
        'place_visits',
        sa.Column('visit_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(length=20), nullable=False),
        sa.Column('entity_key', sa.String(length=255), nullable=False),
        sa.Column('place_name', sa.String(length=200), nullable=False, server_default=''),
        sa.Column('city', sa.String(length=120), nullable=False, server_default=''),
        sa.Column('source', sa.String(length=30), nullable=False, server_default='view'),
        sa.Column('visited_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('visit_id'),
        sa.UniqueConstraint('user_id', 'entity_type', 'entity_key', name='uq_place_visit_user_entity'),
    )
    op.create_index('ix_place_visits_user_id', 'place_visits', ['user_id'])
    op.create_index('ix_place_visits_entity_type', 'place_visits', ['entity_type'])
    op.create_index('ix_place_visits_entity_key', 'place_visits', ['entity_key'])


def downgrade() -> None:
    if has_table('place_visits'):
        op.drop_table('place_visits')
