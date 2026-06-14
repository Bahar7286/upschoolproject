"""Unit tests for personal route generation."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.schemas.ai_schema import PersonalRouteGenerateRequest
from app.services.ai_service import AIService

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_generate_personal_route_rules_fallback() -> None:
    place = MagicMock()
    place.place_id = 1
    place.name = 'Ayasofya'
    place.latitude = 41.0086
    place.longitude = 28.9802
    place.category = 'museum'
    place.description = 'Bizans eseri'
    repo = MagicMock()
    repo.list_places = AsyncMock(return_value=[place])
    service = AIService(route_service=MagicMock(), place_repository=repo)

    with patch('app.services.ai_service.settings') as mock_settings:
        mock_settings.llm_enabled = False
        mock_settings.google_places_enabled = False
        result = await service.generate_personal_route(
            PersonalRouteGenerateRequest(
                city='İstanbul',
                district='Fatih',
                interests=['history', 'museum'],
                duration_minutes=120,
                budget=200,
            )
        )

    assert len(result.stops) >= 1
    assert result.stops[0].name == 'Ayasofya'
    assert result.source == 'rules'


@pytest.mark.asyncio
async def test_district_filter_excludes_other_areas() -> None:
    from app.utils.district_filter import address_matches_district

    assert address_matches_district('Hamdi Restaurant, Fatih/İstanbul', 'Eminönü') is False
    assert address_matches_district('Hamdi Restaurant, Eminönü Fatih', 'Eminönü') is True
