"""premium_requests

Revision ID: g3c4d5e6a7b8
Revises: f2b3c4d5e6a7
Create Date: 2026-05-28
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.db.migration_utils import has_table

revision: str = 'g3c4d5e6a7b8'
down_revision: Union[str, None] = 'f2b3c4d5e6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_table('premium_requests'):
        return
    op.create_table(
        'premium_requests',
        sa.Column('request_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('message', sa.Text(), nullable=False, server_default=''),
        sa.Column('admin_note', sa.Text(), nullable=False, server_default=''),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('request_id'),
    )
    op.create_index('ix_premium_requests_user_id', 'premium_requests', ['user_id'])
    op.create_index('ix_premium_requests_status', 'premium_requests', ['status'])


def downgrade() -> None:
    if has_table('premium_requests'):
        op.drop_table('premium_requests')
