from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.route_repository import RouteRepository
from app.repositories.stop_repository import StopRepository
from app.schemas.ai_schema import AIRecommendationRequest
from app.services.ai_service import AIService
from app.services.route_service import RouteService
from app.services.stop_service import StopService

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_ai_service_uses_llm_when_configured(db_session: AsyncSession) -> None:
    route_repo = RouteRepository(db_session)
    service = AIService(
        RouteService(route_repo),
        StopService(StopRepository(db_session), route_repo),
    )
    llm_payload = {
        'recommendations': [
            {
                'route_id': 1,
                'score': 0.9,
                'reason': 'LLM test önerisi',
                'matched_tags': ['history'],
                'fits_budget': True,
                'fits_duration': True,
            }
        ]
    }

    with patch('app.services.ai_service.settings') as mock_settings:
        mock_settings.llm_enabled = True
        with patch('app.services.ai_service.llm_service') as mock_llm:
            mock_llm.complete_json = AsyncMock(return_value=llm_payload)
            items = await service.generate_recommendations(
                AIRecommendationRequest(interests=['history'], budget=500, duration_minutes=120)
            )
    assert len(items) >= 1
    assert items[0].source == 'llm'
    assert 'LLM' in items[0].reason or items[0].score > 0


def test_ai_status_shape() -> None:
    status = AIService.status()
    assert isinstance(status.llm_enabled, bool)
    assert status.fallback_mode
