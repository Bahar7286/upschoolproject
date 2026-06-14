from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_geo_center_requires_params():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        resp = await client.get('/geo/center')
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_places_nearby_without_key_returns_503(monkeypatch):
    monkeypatch.setattr('app.core.config.settings.google_places_api_key', '')
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        resp = await client.get('/google/places/nearby', params={'lat': 41.0, 'lng': 29.0})
    assert resp.status_code == 503


@pytest.mark.asyncio
async def test_places_nearby_rejects_zero_coords(monkeypatch):
    monkeypatch.setattr('app.core.config.settings.google_places_api_key', 'test-key')
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        resp = await client.get(
            '/google/places/nearby',
            params={'lat': 0, 'lng': 0, 'category': 'museum'},
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_places_nearby_mocked(monkeypatch):
    monkeypatch.setattr('app.core.config.settings.google_places_api_key', 'test-key')
    from app.schemas.google_schema import GooglePlaceSummary

    fake = [
        GooglePlaceSummary(
            place_id='abc',
            name='Test Museum',
            lat=41.01,
            lng=28.98,
            address='Test',
        )
    ]
    with patch(
        'app.api.routers.google_routes.google_places_service.search_nearby',
        new=AsyncMock(return_value=(fake, False)),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url='http://test') as client:
            resp = await client.get(
                '/google/places/nearby',
                params={'lat': 41.0, 'lng': 29.0, 'category': 'museum'},
            )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data['places']) == 1
    assert data['places'][0]['name'] == 'Test Museum'
