import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, MagicMock, patch

from app.repositories.route_repository import RouteRepository
from app.repositories.stop_repository import StopRepository
from app.schemas.ai_schema import (
    AIRecommendationRequest,
    AssistantChatRequest,
    AssistantMessage,
    GeofenceCheckRequest,
    StopNarrationRequest,
)
from app.services.ai_service import AIService
from app.services.llm_service import LLMServiceError
from app.services.route_service import RouteService
from app.services.stop_service import StopService

pytestmark = pytest.mark.unit


def _ai_service(session: AsyncSession) -> AIService:
    route_repo = RouteRepository(session)
    stop_repo = StopRepository(session)
    return AIService(
        route_service=RouteService(repository=route_repo),
        stop_service=StopService(stop_repository=stop_repo, route_repository=route_repo),
    )


@pytest.mark.asyncio
async def test_ai_u01_no_matching_interests_empty(db_session: AsyncSession) -> None:
    service = _ai_service(db_session)
    items = await service.generate_recommendations(
        AIRecommendationRequest(interests=['underwater_archaeology'], budget=500, duration_minutes=120)
    )
    assert items == []


@pytest.mark.asyncio
async def test_ai_u02_budget_fits_flag(db_session: AsyncSession) -> None:
    service = _ai_service(db_session)
    items = await service.generate_recommendations(
        AIRecommendationRequest(interests=['history', 'museum'], budget=500, duration_minutes=120)
    )
    assert len(items) >= 1
    assert any(i.fits_budget for i in items)


@pytest.mark.asyncio
async def test_ai_u03_geofence_triggered_near_stop(db_session: AsyncSession) -> None:
    service = _ai_service(db_session)
    routes = await RouteRepository(db_session).list_all()
    assert routes
    route_id = routes[0].route_id
    stops = await StopRepository(db_session).list_by_route(route_id)
    assert stops
    stop = stops[0]
    result = await service.check_geofence(
        GeofenceCheckRequest(
            route_id=route_id,
            latitude=stop.latitude,
            longitude=stop.longitude,
            radius_m=100,
        )
    )
    assert result.triggered is True
    assert result.stop_id == stop.stop_id


@pytest.mark.asyncio
async def test_ai_u04_geofence_far_away_not_triggered(db_session: AsyncSession) -> None:
    service = _ai_service(db_session)
    routes = await RouteRepository(db_session).list_all()
    route_id = routes[0].route_id
    result = await service.check_geofence(
        GeofenceCheckRequest(
            route_id=route_id,
            latitude=40.0,
            longitude=27.0,
            radius_m=20,
        )
    )
    assert result.triggered is False


@pytest.mark.asyncio
async def test_ai_u05_preview_narration_scripts(db_session: AsyncSession) -> None:
    service = _ai_service(db_session)
    result = await service.preview_narration(
        StopNarrationRequest(
            stop_title='Ayasofya',
            description='Bizans dönemi.',
            languages=['tr', 'en', 'de'],
        )
    )
    assert 'tr' in result.scripts
    assert 'en' in result.scripts
    assert 'de' in result.scripts


@pytest.mark.asyncio
async def test_ai_u06_assistant_greeting_rules() -> None:
    service = AIService(route_service=MagicMock(), stop_service=MagicMock())
    with patch('app.services.ai_service.settings') as mock_settings:
        mock_settings.llm_enabled = True
        mock_settings.google_places_enabled = False
        result = await service.chat_assistant(
            AssistantChatRequest(
                city='İstanbul',
                district='',
                interests=['history'],
                messages=[AssistantMessage(role='user', content='selam')],
            )
        )
    assert result.source == 'rules'
    assert len(result.reply) > 10


@pytest.mark.asyncio
async def test_ai_u07_assistant_llm_fallback_on_error() -> None:
    service = AIService(route_service=MagicMock(), stop_service=MagicMock())
    with patch('app.services.ai_service.settings') as mock_settings:
        mock_settings.llm_enabled = True
        mock_settings.google_places_enabled = False
        with patch('app.services.ai_service.llm_service') as mock_llm:
            mock_llm.complete_text = AsyncMock(side_effect=LLMServiceError('timeout'))
            result = await service.chat_assistant(
                AssistantChatRequest(
                    city='İstanbul',
                    district='Eminönü',
                    interests=['history'],
                    messages=[AssistantMessage(role='user', content='1 günlük rota planla')],
                )
            )
    assert result.source == 'rules'
    assert 'Keşfet' in result.reply or 'Harita' in result.reply


@pytest.mark.asyncio
async def test_ai_u08_assistant_bursa_not_istanbul_fallback() -> None:
    """Bursa sorgusu İstanbul mekanları döndürmemeli."""
    from app.schemas.google_schema import GooglePlaceSummary

    bursa_place = GooglePlaceSummary(
        place_id='bursa1',
        name='Ulucami',
        lat=40.1826,
        lng=29.0665,
        address='Osmangazi, Bursa, Türkiye',
        rating=4.8,
        user_rating_count=1200,
        types=['mosque'],
        google_maps_uri='https://maps.google.com',
    )
    generic_bursa = GooglePlaceSummary(
        place_id='bursa-city',
        name='Bursa',
        lat=40.1885,
        lng=29.0610,
        address='Bursa, Türkiye',
        types=['locality', 'political'],
        google_maps_uri='https://maps.google.com',
    )
    istanbul_place = GooglePlaceSummary(
        place_id='ist1',
        name='Ayasofya',
        lat=41.0086,
        lng=28.9802,
        address='Sultanahmet, Fatih, İstanbul, Türkiye',
        rating=4.9,
        user_rating_count=90000,
        types=['museum'],
        google_maps_uri='https://maps.google.com',
    )
    service = AIService(route_service=MagicMock(), stop_service=MagicMock())
    with patch('app.services.ai_service.settings') as mock_settings:
        mock_settings.llm_enabled = True
        mock_settings.google_places_enabled = True
        with patch('app.services.ai_service.google_places_service') as mock_gp:
            mock_gp.search_nearby = AsyncMock(return_value=([bursa_place, generic_bursa], False))
            mock_gp.search_text = AsyncMock(return_value=([istanbul_place], False))
            result = await service.chat_assistant(
                AssistantChatRequest(
                    city='İstanbul',
                    district='',
                    interests=['history'],
                    messages=[AssistantMessage(role='user', content='bursa 3 gün 1000 tl')],
                )
            )
    assert result.source == 'places'
    assert 'Bursa' in result.reply
    assert '3 günlük' in result.reply
    assert 'İstanbul için' not in result.reply
    assert 'Ulucami' in result.reply or 'Ulu Camii' in result.reply
    assert '1. **Bursa**' not in result.reply
