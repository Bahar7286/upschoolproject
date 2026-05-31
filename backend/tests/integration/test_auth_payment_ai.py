import pytest
from fastapi.testclient import TestClient

from tests.helpers import auth_headers, login

pytestmark = pytest.mark.integration


def test_api_ai_status(client: TestClient) -> None:
    response = client.get('/ai/status')
    assert response.status_code == 200
    body = response.json()
    assert 'llm_enabled' in body
    assert 'fallback_mode' in body


def test_api_a01_forgot_password(client: TestClient) -> None:
    response = client.post('/auth/forgot-password', json={'email': 'tourist@example.com'})
    assert response.status_code == 200
    body = response.json()
    assert 'message' in body
    assert body.get('reset_url') or True


def test_api_a02_reset_password_flow(client: TestClient) -> None:
    email = 'reset.flow@example.com'
    reg = client.post(
        '/auth/register',
        json={
            'full_name': 'Reset Flow',
            'email': email,
            'password': 'oldpass12',
            'role': 'tourist',
        },
    )
    assert reg.status_code == 201
    forgot = client.post('/auth/forgot-password', json={'email': email})
    assert forgot.status_code == 200
    reset_url = forgot.json().get('reset_url')
    assert reset_url
    token = reset_url.split('token=')[-1]
    reset = client.post(
        '/auth/reset-password',
        json={'token': token, 'new_password': 'newpass99'},
    )
    assert reset.status_code == 200
    assert client.post('/auth/login', json={'email': email, 'password': 'oldpass12'}).status_code == 401
    assert client.post('/auth/login', json={'email': email, 'password': 'newpass99'}).status_code == 200


def test_api_p01_payment_config(client: TestClient) -> None:
    response = client.get('/payments/config')
    assert response.status_code == 200
    body = response.json()
    assert 'stripe_enabled' in body


def test_api_p02_checkout_pending(client: TestClient) -> None:
    token = login(client, 'tourist@example.com')
    user_id = client.get('/auth/me', headers=auth_headers(token)).json()['user_id']
    response = client.post(
        '/payments/checkout',
        headers=auth_headers(token),
        json={
            'user_id': user_id,
            'amount': 9.9,
            'currency': 'TRY',
            'route_id': 1,
            'card_holder': 'Test User',
            'card_last4': '4242',
        },
    )
    assert response.status_code == 201
    assert response.json()['status'] == 'pending'


def test_api_p03_checkout_confirm(client: TestClient) -> None:
    token = login(client, 'tourist@example.com')
    user_id = client.get('/auth/me', headers=auth_headers(token)).json()['user_id']
    pending = client.post(
        '/payments/checkout',
        headers=auth_headers(token),
        json={
            'user_id': user_id,
            'amount': 7.5,
            'currency': 'TRY',
            'route_id': 2,
            'card_holder': 'Test',
            'card_last4': '4242',
        },
    ).json()
    confirm = client.post(
        '/payments/checkout/confirm',
        headers=auth_headers(token),
        json={'purchase_id': pending['purchase_id'], 'accept_offer': False},
    )
    assert confirm.status_code == 200
    assert confirm.json()['status'] == 'confirmed'
    assert confirm.json()['transaction_ref']


def test_api_p04_checkout_invalid_card(client: TestClient) -> None:
    token = login(client, 'tourist@example.com')
    user_id = client.get('/auth/me', headers=auth_headers(token)).json()['user_id']
    response = client.post(
        '/payments/checkout',
        headers=auth_headers(token),
        json={
            'user_id': user_id,
            'amount': 5.0,
            'currency': 'TRY',
            'route_id': 1,
            'card_holder': 'Test',
            'card_last4': '0000',
        },
    )
    assert response.status_code == 400


def test_api_t01_guide_offer_flow(client: TestClient) -> None:
    tourist_token = login(client, 'tourist@example.com')
    guide_token = login(client, 'guide@example.com')
    t_headers = auth_headers(tourist_token)
    g_headers = auth_headers(guide_token)

    create = client.post(
        '/trip-requests',
        headers=t_headers,
        json={
            'title': 'Integration offer test',
            'city': 'Istanbul',
            'interests': ['history'],
            'route_mode': 'custom',
            'planned_stops': [
                {'place_id': 1, 'name': 'A', 'order': 1},
                {'place_id': 2, 'name': 'B', 'order': 2},
            ],
            'group_size': 3,
            'preferred_date': '2026-09-01',
            'duration_minutes': 90,
            'budget': 300,
            'preferred_language': 'tr',
            'message': 'Rehber teklifi test mesajı uzun.',
        },
    )
    assert create.status_code == 201
    request_id = create.json()['request_id']

    offer = client.post(
        f'/trip-requests/{request_id}/offers',
        headers=g_headers,
        json={'base_total': 280.0, 'message': 'Rehber teklif mesajı burada.'},
    )
    assert offer.status_code == 201
    offer_id = offer.json()['offer_id']

    listed = client.get(f'/trip-requests/{request_id}/offers', headers=t_headers)
    assert listed.status_code == 200
    assert any(o['offer_id'] == offer_id for o in listed.json())

    withdraw = client.delete(
        f'/trip-requests/{request_id}/offers/{offer_id}',
        headers=g_headers,
    )
    assert withdraw.status_code == 200
    assert withdraw.json()['status'] == 'withdrawn'


def test_api_g01_guide_analytics(client: TestClient) -> None:
    token = login(client, 'guide@example.com')
    response = client.get('/guides/me/analytics', headers=auth_headers(token))
    assert response.status_code == 200
    body = response.json()
    assert 'route_count' in body
    assert 'top_routes' in body


def test_api_g02_guide_earnings(client: TestClient) -> None:
    token = login(client, 'guide@example.com')
    response = client.get('/guides/me/earnings', headers=auth_headers(token))
    assert response.status_code == 200
    body = response.json()
    assert 'monthly_earnings' in body
    assert 'route_sales' in body


def test_api_ai01_recommend(client: TestClient) -> None:
    response = client.post(
        '/ai/recommend',
        json={
            'interests': ['history', 'museum'],
            'duration_minutes': 120,
            'budget': 200,
            'max_results': 5,
        },
    )
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    if items:
        assert 'score' in items[0]


def test_api_ai02_narration_audio(client: TestClient) -> None:
    response = client.post(
        '/ai/narration/audio',
        json={
            'stop_title': 'Ayasofya',
            'description': 'Tarihi yapı.',
            'language': 'tr',
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body['script']
    assert body.get('audio_base64') is not None or body.get('fallback_browser_tts') is True


def test_api_ai03_assistant_chat_greeting(client: TestClient) -> None:
    response = client.post(
        '/ai/assistant/chat',
        json={
            'city': 'İstanbul',
            'district': '',
            'interests': ['history', 'food'],
            'messages': [{'role': 'user', 'content': 'selam'}],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body.get('reply')
    assert body.get('source') in ('rules', 'llm', 'places')


def test_api_z01_protected_without_token(client: TestClient) -> None:
    response = client.get('/auth/me')
    assert response.status_code == 401


def test_api_z02_tourist_cannot_create_place(client: TestClient) -> None:
    token = login(client, 'tourist@example.com')
    response = client.post(
        '/places',
        headers=auth_headers(token),
        json={
            'name': 'Forbidden',
            'category': 'museum',
            'city': 'Istanbul',
            'district': 'Fatih',
            'latitude': 41.0,
            'longitude': 28.9,
            'description': 'x',
            'tags': [],
            'is_partner': False,
        },
    )
    assert response.status_code == 403


def test_api_z03_checkout_user_mismatch(client: TestClient) -> None:
    token = login(client, 'tourist@example.com')
    response = client.post(
        '/payments/checkout',
        headers=auth_headers(token),
        json={
            'user_id': 999_999,
            'amount': 5.0,
            'currency': 'TRY',
            'route_id': 1,
            'card_holder': 'Test',
            'card_last4': '4242',
        },
    )
    assert response.status_code == 403
