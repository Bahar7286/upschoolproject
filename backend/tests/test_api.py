from fastapi.testclient import TestClient


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
        },
    )
    assert create_response.status_code == 200
    created = create_response.json()
    assert created['email'] == 'test.user@example.com'

    list_response = client.get('/users')
    assert list_response.status_code == 200
    assert len(list_response.json()) >= 1


def test_login(client: TestClient) -> None:
    response = client.post(
        '/auth/login',
        json={
            'email': 'test.user@example.com',
            'password': 'securepass',
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert list(payload.keys()) == ['access_token']
    assert payload['access_token'].startswith('mock-token-')


def test_user_crud(client: TestClient) -> None:
    create_response = client.post(
        '/users',
        json={
            'full_name': 'CRUD User',
            'email': 'crud.user@example.com',
            'role': 'tourist',
        },
    )
    assert create_response.status_code == 200
    created_user = create_response.json()
    user_id = created_user['user_id']

    get_response = client.get(f'/users/{user_id}')
    assert get_response.status_code == 200
    assert get_response.json()['email'] == 'crud.user@example.com'

    patch_response = client.patch(
        f'/users/{user_id}',
        json={'full_name': 'Updated CRUD User', 'role': 'guide'},
    )
    assert patch_response.status_code == 200
    assert patch_response.json()['full_name'] == 'Updated CRUD User'
    assert patch_response.json()['role'] == 'guide'

    delete_response = client.delete(f'/users/{user_id}')
    assert delete_response.status_code == 200
    assert delete_response.json()['status'] == 'deleted'


def test_route_and_payment_crud(client: TestClient) -> None:
    user_response = client.post(
        '/users',
        json={
            'full_name': 'Payment User',
            'email': 'payment.user@example.com',
            'role': 'tourist',
        },
    )
    assert user_response.status_code == 200
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
    assert route_create_response.status_code == 200
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
    assert purchase_create_response.status_code == 200
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
