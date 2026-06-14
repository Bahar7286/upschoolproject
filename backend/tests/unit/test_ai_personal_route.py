"""Unit tests for personal route generation."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.schemas.ai_schema import PersonalRouteGenerateRequest
from app.services.ai_service import AIService
from app.utils.city_coords import haversine_km

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
async def test_adiyaman_excludes_istanbul_db_places() -> None:
    istanbul = MagicMock()
    istanbul.place_id = 1
    istanbul.name = 'Ayasofya'
    istanbul.latitude = 41.0086
    istanbul.longitude = 28.9802
    istanbul.category = 'museum'
    istanbul.description = ''
    istanbul.city = 'Istanbul'
    istanbul.district = 'Fatih'

    adiyaman = MagicMock()
    adiyaman.place_id = 2
    adiyaman.name = 'Nemrut Dağı'
    adiyaman.latitude = 37.9810
    adiyaman.longitude = 38.7410
    adiyaman.category = 'historical'
    adiyaman.description = ''
    adiyaman.city = 'Adıyaman'
    adiyaman.district = 'Kahta'

    repo = MagicMock()
    repo.list_places = AsyncMock(return_value=[adiyaman])
    service = AIService(route_service=MagicMock(), place_repository=repo)

    with patch('app.services.ai_service.settings') as mock_settings:
        mock_settings.llm_enabled = False
        mock_settings.google_places_enabled = False
        result = await service.generate_personal_route(
            PersonalRouteGenerateRequest(
                city='Adıyaman',
                interests=['history'],
                duration_minutes=120,
                budget=200,
            )
        )

    assert result.city == 'Adıyaman'
    assert len(result.stops) >= 1
    assert result.stops[0].name == 'Nemrut Dağı'
    assert haversine_km(result.stops[0].lat, result.stops[0].lng, 41.0086, 28.9802) > 700


@pytest.mark.asyncio
async def test_district_filter_excludes_other_areas() -> None:
    from app.utils.district_filter import address_matches_district

    assert address_matches_district('Hamdi Restaurant, Fatih/İstanbul', 'Eminönü') is False
    assert address_matches_district('Hamdi Restaurant, Eminönü Fatih', 'Eminönü') is True
