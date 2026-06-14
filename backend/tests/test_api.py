import pytest
from fastapi.testclient import TestClient

from tests.helpers import admin_token, auth_headers, guide_token, login, register_user

pytestmark = pytest.mark.integration


def test_healthcheck(client: TestClient) -> None:
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}


def test_create_and_list_users_requires_admin(client: TestClient) -> None:
    register_user(client, 'test.user@example.com')
    assert client.get('/users').status_code == 401
    admin = admin_token(client)
    list_response = client.get('/users', headers=auth_headers(admin))
    assert list_response.status_code == 200
    body = list_response.json()
    assert body['total'] >= 1


def test_login(client: TestClient) -> None:
    register_user(client, 'test.user@example.com', password='securepass')
    response = client.post(
        '/auth/login',
        json={'email': 'test.user@example.com', 'password': 'securepass'},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload['token_type'] == 'bearer'
    token = payload['access_token']
    assert len(token.split('.')) == 3


def test_register_login_me(client: TestClient) -> None:
    reg = client.post(
        '/auth/register',
        json={
            'full_name': 'Register User',
            'email': 'register.user@example.com',
            'password': 'securepass',
            'role': 'tourist',
        },
    )
    assert reg.status_code == 201
    body = reg.json()
    assert body['user_id'] >= 1
    assert body['email'] == 'register.user@example.com'
    token = body['access_token']

    dup = client.post(
        '/auth/register',
        json={
            'full_name': 'Other',
            'email': 'register.user@example.com',
            'password': 'otherpass12',
        },
    )
    assert dup.status_code == 409

    me = client.get('/auth/me', headers=auth_headers(token))
    assert me.status_code == 200
    assert me.json()['email'] == 'register.user@example.com'


def test_user_crud(client: TestClient) -> None:
    user_id, token = register_user(client, 'crud.user@example.com')

    get_response = client.get(f'/users/{user_id}', headers=auth_headers(token))
    assert get_response.status_code == 200
    assert get_response.json()['email'] == 'crud.user@example.com'

    by_email = client.get(
        '/users/by-email/crud.user@example.com',
        headers=auth_headers(token),
    )
    assert by_email.status_code == 200

    patch_response = client.patch(
        f'/users/{user_id}',
        headers=auth_headers(token),
        json={'full_name': 'Updated CRUD User'},
    )
    assert patch_response.status_code == 200
    assert patch_response.json()['full_name'] == 'Updated CRUD User'

    assert client.post('/users', json={'full_name': 'X', 'email': 'x@y.com', 'role': 'tourist'}).status_code == 410

    delete_response = client.delete(f'/users/{user_id}', headers=auth_headers(token))
    assert delete_response.status_code == 200

    missing = client.get(f'/users/{user_id}', headers=auth_headers(token))
    assert missing.status_code == 404


def test_route_and_payment_crud(client: TestClient) -> None:
    user_id, tourist_token = register_user(client, 'payment.user@example.com')
    guide = guide_token(client)
    admin = admin_token(client)

    route_create_response = client.post(
        '/routes',
        headers=auth_headers(guide),
        json={
            'title': 'New CRUD Route',
            'city': 'Ankara',
            'estimated_minutes': 60,
            'price': 5.5,
            'tags': ['history', 'museum'],
            'guide_id': 2,
        },
    )
    assert route_create_response.status_code == 201
    route_id = route_create_response.json()['route_id']

    route_patch_response = client.patch(
        f'/routes/{route_id}',
        headers=auth_headers(guide),
        json={'price': 8.0, 'tags': ['food']},
    )
    assert route_patch_response.status_code == 200

    purchase_create_response = client.post(
        '/payments',
        headers=auth_headers(admin),
        json={
            'user_id': user_id,
            'route_id': route_id,
            'amount': 8.0,
            'currency': 'usd',
        },
    )
    assert purchase_create_response.status_code == 201
    purchase_id = purchase_create_response.json()['purchase_id']

    purchase_patch_response = client.patch(
        f'/payments/{purchase_id}',
        headers=auth_headers(tourist_token),
        json={'status': 'refunded'},
    )
    assert purchase_patch_response.status_code == 200

    purchase_delete_response = client.delete(
        f'/payments/{purchase_id}',
        headers=auth_headers(admin),
    )
    assert purchase_delete_response.status_code == 200

    route_delete_response = client.delete(
        f'/routes/{route_id}',
        headers=auth_headers(guide),
    )
    assert route_delete_response.status_code == 200


def test_stop_crud(client: TestClient) -> None:
    guide = guide_token(client)
    route_create = client.post(
        '/routes',
        headers=auth_headers(guide),
        json={
            'title': 'Stops Test Route',
            'city': 'Istanbul',
            'estimated_minutes': 45,
            'price': 12.0,
            'tags': ['history'],
            'guide_id': 2,
        },
    )
    assert route_create.status_code == 201
    route_id = route_create.json()['route_id']

    create_stop = client.post(
        f'/routes/{route_id}/stops',
        headers=auth_headers(guide),
        json={
            'title': 'Hagia Sophia',
            'description': 'Iconic landmark.',
            'latitude': 41.0086,
            'longitude': 28.9802,
            'order_index': 0,
        },
    )
    assert create_stop.status_code == 201
    stop_id = create_stop.json()['stop_id']

    list_response = client.get(f'/routes/{route_id}/stops')
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    patch_response = client.patch(
        f'/routes/{route_id}/stops/{stop_id}',
        headers=auth_headers(guide),
        json={'title': 'Hagia Sophia (Updated)'},
    )
    assert patch_response.status_code == 200

    delete_stop = client.delete(
        f'/routes/{route_id}/stops/{stop_id}',
        headers=auth_headers(guide),
    )
    assert delete_stop.status_code == 200

    client.delete(f'/routes/{route_id}', headers=auth_headers(guide))


def test_list_purchases_admin_only(client: TestClient) -> None:
    assert client.get('/payments').status_code == 401
    admin = admin_token(client)
    list_all = client.get('/payments', headers=auth_headers(admin))
    assert list_all.status_code == 200
    assert isinstance(list_all.json(), list)


def test_stops_preview_masks_without_purchase(client: TestClient) -> None:
    list_routes = client.get('/routes')
    assert list_routes.status_code == 200
    routes = list_routes.json()
    assert len(routes) >= 1
    route_id = routes[0]['route_id']
    stops = client.get(f'/routes/{route_id}/stops').json()
    if len(stops) >= 3 and routes[0]['price'] > 0:
        assert stops[2]['description'] == ''


def test_places_catalog(client: TestClient) -> None:
    all_places = client.get('/places?city=Istanbul')
    assert all_places.status_code == 200
    places = all_places.json()
    assert len(places) >= 20

    museums = client.get('/places?city=Istanbul&category=museum')
    assert museums.status_code == 200
    assert all(p['category'] == 'museum' for p in museums.json())

    categories = client.get('/places/categories?city=Istanbul')
    assert categories.status_code == 200
    assert len(categories.json()) >= 5

    nearby = client.get('/places/nearby?lat=41.0086&lng=28.9802&radius_m=3000')
    assert nearby.status_code == 200
    assert len(nearby.json()) >= 1
    assert 'distance_m' in nearby.json()[0]


def test_plans_notes_reviews(client: TestClient) -> None:
    _, token = register_user(client, 'social.user@example.com')
    headers = auth_headers(token)
    guide = guide_token(client)

    route_create = client.post(
        '/routes',
        headers=auth_headers(guide),
        json={
            'title': 'Social Test Route',
            'city': 'Istanbul',
            'estimated_minutes': 60,
            'price': 5.0,
            'tags': ['history'],
            'guide_id': 2,
        },
    )
    assert route_create.status_code == 201
    route_id = route_create.json()['route_id']

    plan = client.post(
        '/plans',
        headers=headers,
        json={
            'route_id': route_id,
            'title': 'Weekend walk',
            'planned_date': '2026-06-15',
            'planned_time': '09:30',
            'duration_minutes': 90,
            'memo': 'Bring water',
        },
    )
    assert plan.status_code == 201
    plan_id = plan.json()['plan_id']

    plans = client.get('/plans?month=2026-06', headers=headers)
    assert plans.status_code == 200
    assert len(plans.json()) == 1

    note = client.put(
        f'/routes/{route_id}/notes/me',
        headers=headers,
        json={'content': 'Private reminder about tickets'},
    )
    assert note.status_code == 200

    my_note = client.get(f'/routes/{route_id}/notes/me', headers=headers)
    assert my_note.status_code == 200

    review = client.post(
        f'/routes/{route_id}/reviews',
        headers=headers,
        json={'rating': 5, 'comment': 'Amazing route, highly recommended!'},
    )
    assert review.status_code == 201

    reviews = client.get(f'/routes/{route_id}/reviews')
    assert reviews.status_code == 200
    assert len(reviews.json()) >= 1

    summary = client.get(f'/routes/{route_id}/reviews/summary')
    assert summary.status_code == 200

    patch_plan = client.patch(
        f'/plans/{plan_id}',
        headers=headers,
        json={'status': 'completed'},
    )
    assert patch_plan.status_code == 200

    delete_plan = client.delete(f'/plans/{plan_id}', headers=headers)
    assert delete_plan.status_code == 200


def test_guide_crud(client: TestClient) -> None:
    admin = admin_token(client)
    admin_headers = auth_headers(admin)

    assert client.post(
        '/guides',
        json={
            'full_name': 'New Guide',
            'email': 'new.guide@example.com',
            'password': 'securepass',
        },
    ).status_code == 401

    create = client.post(
        '/guides',
        headers=admin_headers,
        json={
            'full_name': 'New Guide',
            'email': 'new.guide@example.com',
            'password': 'securepass',
        },
    )
    assert create.status_code == 201
    guide_id = create.json()['guide_id']
    guide_auth = auth_headers(login(client, 'new.guide@example.com', 'securepass'))

    listing = client.get('/guides')
    assert listing.status_code == 200

    get_one = client.get(f'/guides/{guide_id}')
    assert get_one.status_code == 200

    assert client.patch(
        f'/guides/{guide_id}',
        json={'full_name': 'Hacker'},
    ).status_code == 401

    patch = client.patch(
        f'/guides/{guide_id}',
        headers=guide_auth,
        json={'full_name': 'Updated Guide'},
    )
    assert patch.status_code == 200

    route = client.post(
        f'/guides/{guide_id}/routes',
        headers=guide_auth,
        json={
            'title': 'Guide Route',
            'city': 'Istanbul',
            'estimated_minutes': 75,
            'price': 11.0,
            'tags': ['history'],
        },
    )
    assert route.status_code == 201
    route_id = route.json()['route_id']

    routes = client.get(f'/guides/{guide_id}/routes')
    assert routes.status_code == 200

    assert client.get(f'/guides/{guide_id}/earnings').status_code == 401

    earnings = client.get(f'/guides/{guide_id}/earnings', headers=guide_auth)
    assert earnings.status_code == 200

    payout = client.post(
        '/guides/payout',
        headers=guide_auth,
        json={'guide_id': guide_id, 'amount': 1.0},
    )
    assert payout.status_code == 200

    delete_route = client.delete(f'/guides/{guide_id}/routes/{route_id}', headers=guide_auth)
    assert delete_route.status_code == 200

    delete_guide = client.delete(f'/guides/{guide_id}', headers=admin_headers)
    assert delete_guide.status_code == 200


def test_leaderboard_and_geofence(client: TestClient) -> None:
    token = login(client, 'tourist@example.com')
    headers = auth_headers(token)

    board = client.get('/auth/leaderboard', headers=headers)
    assert board.status_code == 200
    assert len(board.json()['entries']) >= 1

    routes = client.get('/routes')
    route_id = routes.json()[0]['route_id']

    geo = client.post(
        '/ai/geofence-check',
        json={'route_id': route_id, 'latitude': 41.0082, 'longitude': 28.9784, 'radius_m': 100},
    )
    assert geo.status_code == 200

    narration = client.post(
        '/ai/narration/preview',
        json={'stop_title': 'Ayasofya', 'description': 'Bizans ve Osmanlı dönemi.', 'languages': ['tr', 'en']},
    )
    assert narration.status_code == 200


def test_trip_request_cancel_and_offers(client: TestClient) -> None:
    tourist_token = login(client, 'tourist@example.com')
    t_headers = auth_headers(tourist_token)

    create = client.post(
        '/trip-requests',
        headers=t_headers,
        json={
            'title': 'Test gezi talebi',
            'city': 'Istanbul',
            'interests': ['history'],
            'route_mode': 'custom',
            'planned_stops': [
                {'place_id': 1, 'name': 'Ayasofya', 'order': 1},
                {'place_id': 2, 'name': 'Topkapı', 'order': 2},
            ],
            'group_size': 4,
            'preferred_date': '2026-07-01',
            'duration_minutes': 120,
            'budget': 500,
            'preferred_language': 'tr',
            'message': 'Rehber arıyorum, sabah turu tercih.',
        },
    )
    assert create.status_code == 201
    request_id = create.json()['request_id']

    offers = client.get(f'/trip-requests/{request_id}/offers', headers=t_headers)
    assert offers.status_code == 200

    cancel = client.patch(
        f'/trip-requests/{request_id}',
        headers=t_headers,
        json={'status': 'cancelled'},
    )
    assert cancel.status_code == 200


def test_admin_place_crud(client: TestClient) -> None:
    admin = admin_token(client)
    headers = auth_headers(admin)

    create = client.post(
        '/places',
        headers=headers,
        json={
            'name': 'Test Müze',
            'category': 'museum',
            'city': 'Istanbul',
            'district': 'Fatih',
            'latitude': 41.01,
            'longitude': 28.98,
            'description': 'Test POI',
            'tags': ['test'],
            'is_partner': False,
        },
    )
    assert create.status_code == 201
    place_id = create.json()['place_id']

    patch = client.patch(
        f'/places/{place_id}',
        headers=headers,
        json={'description': 'Updated test POI'},
    )
    assert patch.status_code == 200

    delete = client.delete(f'/places/{place_id}', headers=headers)
    assert delete.status_code == 200
