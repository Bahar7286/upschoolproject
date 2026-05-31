"""fk_lifecycle_moderation

Revision ID: cea7936f46e5
Revises: b03b7a457a90
Create Date: 2026-05-28 22:04:29.198918

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.db.migration_utils import (
    add_column_if_missing,
    create_foreign_key_if_missing,
    create_index_if_missing,
    has_table,
)


# revision identifiers, used by Alembic.
revision: str = 'cea7936f46e5'
down_revision: Union[str, Sequence[str], None] = 'b03b7a457a90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    if not has_table('content_reports'):
        op.create_table(
            'content_reports',
            sa.Column('report_id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('reporter_user_id', sa.Integer(), nullable=False),
            sa.Column('entity_type', sa.String(length=32), nullable=False),
            sa.Column('entity_id', sa.Integer(), nullable=False),
            sa.Column('reason', sa.String(length=64), nullable=False),
            sa.Column('details', sa.Text(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False),
            sa.Column('admin_id', sa.Integer(), nullable=True),
            sa.Column('resolved_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['admin_id'], ['users.user_id']),
            sa.ForeignKeyConstraint(['reporter_user_id'], ['users.user_id']),
            sa.PrimaryKeyConstraint('report_id'),
        )
    create_index_if_missing('ix_content_reports_entity_id', 'content_reports', ['entity_id'])
    create_index_if_missing('ix_content_reports_entity_type', 'content_reports', ['entity_type'])
    create_index_if_missing('ix_content_reports_reporter_user_id', 'content_reports', ['reporter_user_id'])
    create_index_if_missing('ix_content_reports_status', 'content_reports', ['status'])

    if not has_table('moderation_decisions'):
        op.create_table(
            'moderation_decisions',
            sa.Column('decision_id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('entity_type', sa.String(length=32), nullable=False),
            sa.Column('entity_id', sa.Integer(), nullable=False),
            sa.Column('admin_id', sa.Integer(), nullable=False),
            sa.Column('action', sa.String(length=32), nullable=False),
            sa.Column('reason_codes', sa.String(length=500), nullable=False),
            sa.Column('public_feedback', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['admin_id'], ['users.user_id']),
            sa.PrimaryKeyConstraint('decision_id'),
        )
    create_index_if_missing('ix_moderation_decisions_admin_id', 'moderation_decisions', ['admin_id'])
    create_index_if_missing('ix_moderation_decisions_entity_id', 'moderation_decisions', ['entity_id'])
    create_index_if_missing('ix_moderation_decisions_entity_type', 'moderation_decisions', ['entity_type'])

    create_foreign_key_if_missing(
        name='fk_purchases_trip_request_id',
        source_table='purchases',
        referent_table='trip_requests',
        local_cols=['trip_request_id'],
        remote_cols=['request_id'],
        ondelete='SET NULL',
    )
    create_foreign_key_if_missing(
        name='fk_purchases_offer_id',
        source_table='purchases',
        referent_table='guide_offers',
        local_cols=['offer_id'],
        remote_cols=['offer_id'],
        ondelete='SET NULL',
    )
    create_foreign_key_if_missing(
        name='fk_route_notes_route_id',
        source_table='route_notes',
        referent_table='routes',
        local_cols=['route_id'],
        remote_cols=['route_id'],
        ondelete='CASCADE',
    )
    create_foreign_key_if_missing(
        name='fk_route_notes_user_id',
        source_table='route_notes',
        referent_table='users',
        local_cols=['user_id'],
        remote_cols=['user_id'],
        ondelete='CASCADE',
    )
    create_foreign_key_if_missing(
        name='fk_route_reviews_route_id',
        source_table='route_reviews',
        referent_table='routes',
        local_cols=['route_id'],
        remote_cols=['route_id'],
        ondelete='CASCADE',
    )
    create_foreign_key_if_missing(
        name='fk_route_reviews_user_id',
        source_table='route_reviews',
        referent_table='users',
        local_cols=['user_id'],
        remote_cols=['user_id'],
        ondelete='CASCADE',
    )

    if has_table('routes'):
        add_column_if_missing(
            'routes',
            sa.Column('status', sa.String(length=32), nullable=False, server_default='published'),
        )
        add_column_if_missing(
            'routes',
            sa.Column('seo_description', sa.Text(), nullable=False, server_default=''),
        )
        add_column_if_missing(
            'routes',
            sa.Column('moderation_note', sa.Text(), nullable=False, server_default=''),
        )
        add_column_if_missing('routes', sa.Column('submitted_at', sa.DateTime(), nullable=True))
        add_column_if_missing('routes', sa.Column('published_at', sa.DateTime(), nullable=True))
        create_index_if_missing('ix_routes_status', 'routes', ['status'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('routes', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_routes_status'))
        batch_op.drop_column('published_at')
        batch_op.drop_column('submitted_at')
        batch_op.drop_column('moderation_note')
        batch_op.drop_column('seo_description')
        batch_op.drop_column('status')

    with op.batch_alter_table('route_reviews', schema=None) as batch_op:
        batch_op.drop_constraint('fk_route_reviews_route_id', type_='foreignkey')
        batch_op.drop_constraint('fk_route_reviews_user_id', type_='foreignkey')

    with op.batch_alter_table('route_notes', schema=None) as batch_op:
        batch_op.drop_constraint('fk_route_notes_route_id', type_='foreignkey')
        batch_op.drop_constraint('fk_route_notes_user_id', type_='foreignkey')

    with op.batch_alter_table('purchases', schema=None) as batch_op:
        batch_op.drop_constraint('fk_purchases_trip_request_id', type_='foreignkey')
        batch_op.drop_constraint('fk_purchases_offer_id', type_='foreignkey')

    with op.batch_alter_table('moderation_decisions', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_moderation_decisions_entity_type'))
        batch_op.drop_index(batch_op.f('ix_moderation_decisions_entity_id'))
        batch_op.drop_index(batch_op.f('ix_moderation_decisions_admin_id'))

    op.drop_table('moderation_decisions')
    with op.batch_alter_table('content_reports', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_content_reports_status'))
        batch_op.drop_index(batch_op.f('ix_content_reports_reporter_user_id'))
        batch_op.drop_index(batch_op.f('ix_content_reports_entity_type'))
        batch_op.drop_index(batch_op.f('ix_content_reports_entity_id'))

    op.drop_table('content_reports')
