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


def has_foreign_key(table: str, name: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if table not in insp.get_table_names():
        return False
    return any(fk.get('name') == name for fk in insp.get_foreign_keys(table))


def create_foreign_key_if_missing(
    *,
    name: str,
    source_table: str,
    referent_table: str,
    local_cols: list[str],
    remote_cols: list[str],
    ondelete: str | None = None,
) -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'sqlite':
        # SQLite cannot ALTER constraints; test DBs rely on SQLAlchemy metadata instead.
        return
    if has_foreign_key(source_table, name):
        return
    op.create_foreign_key(name, source_table, referent_table, local_cols, remote_cols, ondelete=ondelete)


def create_index_if_missing(name: str, table: str, columns: list[str], *, unique: bool = False) -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if table not in insp.get_table_names():
        return
    existing = {idx['name'] for idx in insp.get_indexes(table)}
    if name in existing:
        return
    op.create_index(name, table, columns, unique=unique)
