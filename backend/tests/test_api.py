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
            'password': 'securepass',
        },
    )
    assert create_response.status_code == 200
    created = create_response.json()
    assert created['email'] == 'test.user@example.com'

    list_response = client.get('/users')
    assert list_response.status_code == 200
    assert len(list_response.json()) >= 1


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
    assert reg.status_code == 200
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
    assert route_create.status_code == 200
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
    assert create_stop.status_code == 200
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
