from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.llm_service import LLMService, LLMServiceError

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_openrouter_complete_json() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = ''
    mock_response.json.return_value = {
        'choices': [{'message': {'content': '{"recommendations":[]}'}}],
    }

    with patch('app.services.llm_service.settings') as mock_settings:
        mock_settings.llm_enabled = True
        mock_settings.llm_provider = 'openrouter'
        mock_settings.openrouter_api_key = 'sk-test'
        mock_settings.openrouter_model = 'test/model'
        mock_settings.openrouter_base_url = 'https://openrouter.ai/api/v1'
        mock_settings.frontend_url = 'http://localhost:5173'
        mock_settings.llm_timeout_seconds = 30
        mock_settings.gemini_api_key = ''
        mock_settings.gemini_model = 'gemini-2.0-flash'

        service = LLMService()
        with patch('httpx.AsyncClient') as mock_client:
            instance = mock_client.return_value.__aenter__.return_value
            instance.post = AsyncMock(return_value=mock_response)
            data = await service.complete_json(system='sys', user='user')
    assert data == {'recommendations': []}


@pytest.mark.asyncio
async def test_llm_disabled_raises() -> None:
    with patch('app.services.llm_service.settings') as mock_settings:
        mock_settings.llm_enabled = False
        service = LLMService()
        with pytest.raises(LLMServiceError):
            await service.complete_text(system='s', user='u')
