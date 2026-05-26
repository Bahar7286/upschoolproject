import pytest
from fastapi.testclient import TestClient

from tests.helpers import auth_headers, login

pytestmark = pytest.mark.integration


def test_healthcheck(client: TestClient) -> None:
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}


def test_create_and_list_users(client: TestClient) -> None:
    create_response = client.post(
        '/users',
        json={
            'full_name': 'Test User',
            'email': 'test.user@example.com',
            'role': 'tourist',
            'password': 'securepass',
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created['email'] == 'test.user@example.com'

    list_response = client.get('/users')
    assert list_response.status_code == 200
    body = list_response.json()
    assert body['total'] >= 1
    assert len(body['items']) >= 1


def test_login(client: TestClient) -> None:
    # Her test yeni DB ile çalışır; kullanıcıyı bu test içinde oluştur.
    client.post(
        '/users',
        json={
            'full_name': 'Test User',
            'email': 'test.user@example.com',
            'role': 'tourist',
            'password': 'securepass',
        },
    )
    response = client.post(
        '/auth/login',
        json={
            'email': 'test.user@example.com',
            'password': 'securepass',
        },
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
    assert body['token_type'] == 'bearer'
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

    me = client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert me.status_code == 200
    assert me.json()['email'] == 'register.user@example.com'


def test_user_crud(client: TestClient) -> None:
    create_response = client.post(
        '/users',
        json={
            'full_name': 'CRUD User',
            'email': 'crud.user@example.com',
            'role': 'tourist',
            'password': 'securepass',
        },
    )
    assert create_response.status_code == 201
    created_user = create_response.json()
    user_id = created_user['user_id']

    get_response = client.get(f'/users/{user_id}')
    assert get_response.status_code == 200
    assert get_response.json()['email'] == 'crud.user@example.com'

    by_email = client.get('/users/by-email/crud.user@example.com')
    assert by_email.status_code == 200
    assert by_email.json()['user_id'] == user_id

    patch_response = client.patch(
        f'/users/{user_id}',
        json={'full_name': 'Updated CRUD User', 'role': 'guide', 'password': 'newpass12'},
    )
    assert patch_response.status_code == 200
    assert patch_response.json()['full_name'] == 'Updated CRUD User'
    assert patch_response.json()['role'] == 'guide'

    dup = client.post(
        '/users',
        json={
            'full_name': 'Duplicate',
            'email': 'crud.user@example.com',
            'role': 'tourist',
            'password': 'securepass',
        },
    )
    assert dup.status_code == 409

    delete_response = client.delete(f'/users/{user_id}')
    assert delete_response.status_code == 200
    assert delete_response.json()['status'] == 'deleted'

    missing = client.get(f'/users/{user_id}')
    assert missing.status_code == 404


def test_route_and_payment_crud(client: TestClient) -> None:
    user_response = client.post(
        '/users',
        json={
            'full_name': 'Payment User',
            'email': 'payment.user@example.com',
            'role': 'tourist',
        },
    )
    assert user_response.status_code == 201
    user_id = user_response.json()['user_id']

    route_create_response = client.post(
        '/routes',
        json={
            'title': 'New CRUD Route',
            'city': 'Ankara',
            'estimated_minutes': 60,
            'price': 5.5,
            'tags': ['history', 'museum'],
            'guide_id': 1,
        },
    )
    assert route_create_response.status_code == 201
    route_id = route_create_response.json()['route_id']

    route_patch_response = client.patch(
        f'/routes/{route_id}',
        json={'price': 8.0, 'tags': ['food']},
    )
    assert route_patch_response.status_code == 200
    assert route_patch_response.json()['price'] == 8.0
    assert route_patch_response.json()['tags'] == ['food']

    purchase_create_response = client.post(
        '/payments',
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
        json={'status': 'refunded'},
    )
    assert purchase_patch_response.status_code == 200
    assert purchase_patch_response.json()['status'] == 'refunded'

    purchase_delete_response = client.delete(f'/payments/{purchase_id}')
    assert purchase_delete_response.status_code == 200
    assert purchase_delete_response.json()['status'] == 'deleted'

    route_delete_response = client.delete(f'/routes/{route_id}')
    assert route_delete_response.status_code == 200
    assert route_delete_response.json()['status'] == 'deleted'


def test_stop_crud(client) -> None:
    route_create = client.post(
        '/routes',
        json={
            'title': 'Stops Test Route',
            'city': 'Istanbul',
            'estimated_minutes': 45,
            'price': 12.0,
            'tags': ['history'],
            'guide_id': 1,
        },
    )
    assert route_create.status_code == 201
    route_id = route_create.json()['route_id']

    create_stop = client.post(
        f'/routes/{route_id}/stops',
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
        json={'title': 'Hagia Sophia (Updated)'},
    )
    assert patch_response.status_code == 200
    assert patch_response.json()['title'] == 'Hagia Sophia (Updated)'

    delete_stop = client.delete(f'/routes/{route_id}/stops/{stop_id}')
    assert delete_stop.status_code == 200
    assert delete_stop.json()['status'] == 'deleted'

    client.delete(f'/routes/{route_id}')


def test_list_purchases(client) -> None:
    list_all = client.get('/payments')
    assert list_all.status_code == 200
    assert isinstance(list_all.json(), list)


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
    reg = client.post(
        '/auth/register',
        json={
            'full_name': 'Social User',
            'email': 'social.user@example.com',
            'password': 'securepass',
            'role': 'tourist',
        },
    )
    assert reg.status_code == 201
    token = reg.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    route_create = client.post(
        '/routes',
        json={
            'title': 'Social Test Route',
            'city': 'Istanbul',
            'estimated_minutes': 60,
            'price': 5.0,
            'tags': ['history'],
            'guide_id': 1,
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
    assert note.json()['content'].startswith('Private')

    my_note = client.get(f'/routes/{route_id}/notes/me', headers=headers)
    assert my_note.status_code == 200
    assert my_note.json()['content'].startswith('Private')

    review = client.post(
        f'/routes/{route_id}/reviews',
        headers=headers,
        json={'rating': 5, 'comment': 'Amazing route, highly recommended!'},
    )
    assert review.status_code == 201
    assert review.json()['rating'] == 5

    reviews = client.get(f'/routes/{route_id}/reviews')
    assert reviews.status_code == 200
    assert len(reviews.json()) >= 1

    summary = client.get(f'/routes/{route_id}/reviews/summary')
    assert summary.status_code == 200
    assert summary.json()['review_count'] >= 1

    patch_plan = client.patch(
        f'/plans/{plan_id}',
        headers=headers,
        json={'status': 'completed'},
    )
    assert patch_plan.status_code == 200
    assert patch_plan.json()['status'] == 'completed'

    delete_plan = client.delete(f'/plans/{plan_id}', headers=headers)
    assert delete_plan.status_code == 200


def test_guide_crud(client: TestClient) -> None:
    create = client.post(
        '/guides',
        json={
            'full_name': 'New Guide',
            'email': 'new.guide@example.com',
            'password': 'securepass',
        },
    )
    assert create.status_code == 201
    guide = create.json()
    guide_id = guide['guide_id']
    assert guide['role'] == 'guide'
    assert guide['email'] == 'new.guide@example.com'

    listing = client.get('/guides')
    assert listing.status_code == 200
    assert listing.json()['total'] >= 1

    get_one = client.get(f'/guides/{guide_id}')
    assert get_one.status_code == 200
    assert get_one.json()['full_name'] == 'New Guide'

    patch = client.patch(
        f'/guides/{guide_id}',
        json={'full_name': 'Updated Guide'},
    )
    assert patch.status_code == 200
    assert patch.json()['full_name'] == 'Updated Guide'

    route = client.post(
        f'/guides/{guide_id}/routes',
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
    assert route.json()['guide_id'] == guide_id

    routes = client.get(f'/guides/{guide_id}/routes')
    assert routes.status_code == 200
    assert routes.json()['total'] == 1

    earnings = client.get(f'/guides/{guide_id}/earnings')
    assert earnings.status_code == 200
    assert earnings.json()['guide_id'] == guide_id

    payout = client.post(
        '/guides/payout',
        json={'guide_id': guide_id, 'amount': 1.0},
    )
    assert payout.status_code == 200
    assert payout.json()['status'] in ('queued', 'rejected')

    delete_route = client.delete(f'/guides/{guide_id}/routes/{route_id}')
    assert delete_route.status_code == 200

    delete_guide = client.delete(f'/guides/{guide_id}')
    assert delete_guide.status_code == 200

    missing = client.get(f'/guides/{guide_id}')
    assert missing.status_code == 404


def test_leaderboard_and_geofence(client: TestClient) -> None:
    token = login(client, 'tourist@example.com')
    headers = auth_headers(token)

    board = client.get('/auth/leaderboard', headers=headers)
    assert board.status_code == 200
    body = board.json()
    assert 'entries' in body
    assert len(body['entries']) >= 1

    routes = client.get('/routes')
    assert routes.status_code == 200
    route_id = routes.json()[0]['route_id']

    geo = client.post(
        '/ai/geofence-check',
        json={'route_id': route_id, 'latitude': 41.0082, 'longitude': 28.9784, 'radius_m': 100},
    )
    assert geo.status_code == 200
    assert 'triggered' in geo.json()

    narration = client.post(
        '/ai/narration/preview',
        json={'stop_title': 'Ayasofya', 'description': 'Bizans ve Osmanlı dönemi.', 'languages': ['tr', 'en']},
    )
    assert narration.status_code == 200
    assert 'tr' in narration.json()['scripts']


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
    assert isinstance(offers.json(), list)

    cancel = client.patch(
        f'/trip-requests/{request_id}',
        headers=t_headers,
        json={'status': 'cancelled'},
    )
    assert cancel.status_code == 200
    assert cancel.json()['status'] == 'cancelled'


def test_admin_place_crud(client: TestClient) -> None:
    admin_token = login(client, 'admin@example.com')
    headers = auth_headers(admin_token)

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
    assert patch.json()['description'] == 'Updated test POI'

    delete = client.delete(f'/places/{place_id}', headers=headers)
    assert delete.status_code == 200
