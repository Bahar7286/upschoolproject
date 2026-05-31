"""Tests for deploy-time migration healing (routes.status drift)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.db import migrate_on_start as mod

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_stamp_legacy_without_status_uses_baseline() -> None:
    with patch.object(mod, '_column_exists', new_callable=AsyncMock) as col:
        col.side_effect = lambda table, column: False
        with patch.object(mod, '_table_exists', new_callable=AsyncMock, return_value=True):
            with patch.object(mod, '_run_alembic') as run:
                await mod._stamp_for_legacy_schema()
                run.assert_called_once_with('stamp', mod.REVISION_BASELINE)


@pytest.mark.asyncio
async def test_stamp_legacy_with_status_uses_lifecycle() -> None:
    async def col(table: str, column: str) -> bool:
        return table == 'routes' and column == 'status'

    with patch.object(mod, '_column_exists', side_effect=col):
        with patch.object(mod, '_table_exists', new_callable=AsyncMock, return_value=False):
            with patch.object(mod, '_run_alembic') as run:
                await mod._stamp_for_legacy_schema()
                run.assert_called_once_with('stamp', mod.REVISION_LIFECYCLE)


@pytest.mark.asyncio
async def test_repair_routes_lifecycle_runs_sql_when_missing() -> None:
    mock_conn = AsyncMock()
    mock_begin = AsyncMock()
    mock_begin.__aenter__.return_value = mock_conn
    mock_begin.__aexit__.return_value = None
    mock_engine = MagicMock()
    mock_engine.url = 'postgresql+asyncpg://user:pass@localhost/db'
    mock_engine.begin.return_value = mock_begin

    with patch.object(mod, '_column_exists', new_callable=AsyncMock, return_value=False):
        with patch.object(mod, '_table_exists', new_callable=AsyncMock, return_value=True):
            with patch.object(mod, '_current_revision', new_callable=AsyncMock, return_value='cea7936f46e5'):
                with patch.object(mod, 'engine', mock_engine):
                    await mod._repair_routes_lifecycle_columns()
                    assert mock_conn.execute.await_count == len(mod._REPAIR_ROUTES_LIFECYCLE_SQL)


@pytest.mark.asyncio
async def test_repair_routes_lifecycle_skips_when_present() -> None:
    mock_engine = MagicMock()
    with patch.object(mod, '_column_exists', new_callable=AsyncMock, return_value=True):
        with patch.object(mod, 'engine', mock_engine):
            await mod._repair_routes_lifecycle_columns()
            mock_engine.begin.assert_not_called()
