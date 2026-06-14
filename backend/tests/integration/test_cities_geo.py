import pytest
from fastapi.testclient import TestClient

pytestmark = [pytest.mark.integration, pytest.mark.full_geo]


def test_list_cities_has_81_provinces(client_full_geo: TestClient) -> None:
    response = client_full_geo.get('/cities')
    assert response.status_code == 200
    cities = response.json()
    assert len(cities) == 81
    assert any(c['name_tr'] == 'Adıyaman' and c['plate_code'] == '02' for c in cities)


def test_list_districts_for_city(client_full_geo: TestClient) -> None:
    response = client_full_geo.get('/cities/2/districts')
    assert response.status_code == 200
    districts = response.json()
    assert len(districts) >= 1
    assert all(d['city_id'] == 2 for d in districts)


def test_list_districts_unknown_city_404(client_full_geo: TestClient) -> None:
    response = client_full_geo.get('/cities/9999/districts')
    assert response.status_code == 404


def test_geo_center_city(client_full_geo: TestClient) -> None:
    response = client_full_geo.get('/geo/center', params={'city_id': 2})
    assert response.status_code == 200
    body = response.json()
    assert body['city_name']
    assert body['lat'] != 0.0 or body['lng'] != 0.0


def test_ready_endpoint(client: TestClient) -> None:
    response = client.get('/ready')
    assert response.status_code == 200
    assert response.json()['database'] == 'ok'
