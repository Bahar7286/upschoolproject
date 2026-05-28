"""Helpers for idempotent Alembic revisions."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


def has_table(name: str) -> bool:
    bind = op.get_bind()
    return name in sa.inspect(bind).get_table_names()


def has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if table not in insp.get_table_names():
        return False
    return any(c['name'] == column for c in insp.get_columns(table))


def add_column_if_missing(table: str, column: sa.Column) -> None:
    if not has_column(table, column.name):
        op.add_column(table, column)
