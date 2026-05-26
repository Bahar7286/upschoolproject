from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.tts_service import synthesize_mp3_base64

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_synthesize_empty_returns_none() -> None:
    assert await synthesize_mp3_base64('') is None


@pytest.mark.asyncio
async def test_synthesize_import_error_returns_none() -> None:
    import builtins

    real_import = builtins.__import__

    def fake_import(name: str, *args, **kwargs):
        if name == 'edge_tts':
            raise ImportError('no edge-tts')
        return real_import(name, *args, **kwargs)

    with patch('builtins.__import__', side_effect=fake_import):
        assert await synthesize_mp3_base64('Merhaba', 'tr') is None


@pytest.mark.asyncio
async def test_synthesize_success_mocked() -> None:
    mock_edge = MagicMock()
    mock_communicate = MagicMock()
    mock_communicate.save = AsyncMock()
    mock_edge.Communicate.return_value = mock_communicate

    with patch.dict('sys.modules', {'edge_tts': mock_edge}):
        with patch('pathlib.Path.is_file', return_value=True):
            with patch('pathlib.Path.read_bytes', return_value=b'fake-mp3'):
                result = await synthesize_mp3_base64('Test narration', 'en')
    assert result is not None
    assert len(result) > 0
