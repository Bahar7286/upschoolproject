"""region image_url + trip_extra_stops

Revision ID: e7f8a9b0c1d2
Revises: d4e8f1a2b3c4
Create Date: 2026-05-28

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.db.migration_utils import add_column_if_missing, has_table

revision: str = 'e7f8a9b0c1d2'
down_revision: Union[str, None] = 'd4e8f1a2b3c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    add_column_if_missing('cities', sa.Column('image_url', sa.String(length=1024), nullable=True))
    add_column_if_missing('districts', sa.Column('image_url', sa.String(length=1024), nullable=True))
    add_column_if_missing('places', sa.Column('image_url', sa.String(length=1024), nullable=True))

    if not has_table('trip_extra_stops'):
        op.create_table(
            'trip_extra_stops',
            sa.Column('extra_stop_id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('route_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=180), nullable=False),
            sa.Column('description', sa.Text(), nullable=False, server_default=''),
            sa.Column('latitude', sa.Float(), nullable=False),
            sa.Column('longitude', sa.Float(), nullable=False),
            sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('place_id', sa.Integer(), nullable=True),
            sa.Column('google_place_id', sa.String(length=128), nullable=True),
            sa.ForeignKeyConstraint(['route_id'], ['routes.route_id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('extra_stop_id'),
        )
        op.create_index('ix_trip_extra_stops_user_route', 'trip_extra_stops', ['user_id', 'route_id'])


def downgrade() -> None:
    from app.db.migration_utils import has_column

    if has_table('trip_extra_stops'):
        op.drop_index('ix_trip_extra_stops_user_route', table_name='trip_extra_stops')
        op.drop_table('trip_extra_stops')
    if has_column('places', 'image_url'):
        op.drop_column('places', 'image_url')
    if has_column('districts', 'image_url'):
        op.drop_column('districts', 'image_url')
    if has_column('cities', 'image_url'):
        op.drop_column('cities', 'image_url')
