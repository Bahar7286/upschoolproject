"""Paylaşılan test yardımcıları."""

from fastapi.testclient import TestClient


def login(client: TestClient, email: str, password: str = 'demo123') -> str:
    response = client.post('/auth/login', json={'email': email, 'password': password})
    assert response.status_code == 200, response.text
    return response.json()['access_token']


def auth_headers(token: str) -> dict[str, str]:
    return {'Authorization': f'Bearer {token}'}


def register_user(
    client: TestClient,
    email: str,
    password: str = 'securepass',
    role: str = 'tourist',
    full_name: str = 'Test User',
) -> tuple[int, str]:
    response = client.post(
        '/auth/register',
        json={
            'full_name': full_name,
            'email': email,
            'password': password,
            'role': role,
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    return body['user_id'], body['access_token']


def admin_token(client: TestClient) -> str:
    return login(client, 'admin@example.com')


def guide_token(client: TestClient) -> str:
    return login(client, 'guide@example.com')
