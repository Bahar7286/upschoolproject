"""user preferred_city

Revision ID: d4e8f1a2b3c4
Revises: cea7936f46e5
Create Date: 2026-05-28

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'd4e8f1a2b3c4'
down_revision: Union[str, None] = 'cea7936f46e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('preferred_city', sa.String(length=80), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'preferred_city')
