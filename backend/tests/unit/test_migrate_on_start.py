"""Tests for deploy-time migration healing (routes.status drift)."""

from unittest.mock import AsyncMock, patch

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
async def test_ensure_route_lifecycle_re_stamps_when_missing() -> None:
    with patch.object(mod, '_column_exists', new_callable=AsyncMock, return_value=False):
        with patch.object(mod, '_table_exists', new_callable=AsyncMock, return_value=True):
            with patch.object(mod, '_current_revision', new_callable=AsyncMock, return_value='cea7936f46e5'):
                with patch.object(mod, '_run_alembic') as run:
                    await mod._ensure_route_lifecycle_columns()
                    assert run.call_args_list[0].args == ('stamp', mod.REVISION_BASELINE)
                    assert run.call_args_list[1].args == ('upgrade', 'head')


@pytest.mark.asyncio
async def test_ensure_route_lifecycle_skips_when_present() -> None:
    with patch.object(mod, '_column_exists', new_callable=AsyncMock, return_value=True):
        with patch.object(mod, '_run_alembic') as run:
            await mod._ensure_route_lifecycle_columns()
            run.assert_not_called()
