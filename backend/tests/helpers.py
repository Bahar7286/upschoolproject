"""Paylaşılan test yardımcıları."""

from fastapi.testclient import TestClient


def login(client: TestClient, email: str, password: str = 'demo123') -> str:
    response = client.post('/auth/login', json={'email': email, 'password': password})
    assert response.status_code == 200, response.text
    return response.json()['access_token']


def auth_headers(token: str) -> dict[str, str]:
    return {'Authorization': f'Bearer {token}'}
