import pytest

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password

pytestmark = pytest.mark.unit


def test_hash_and_verify_password() -> None:
    hashed = hash_password('securepass')
    assert hashed != 'securepass'
    assert verify_password('securepass', hashed)
    assert not verify_password('wrong', hashed)


def test_jwt_roundtrip() -> None:
    token = create_access_token(user_id=42, email='test@example.com')
    payload = decode_access_token(token)
    assert payload['sub'] == '42'
    assert payload['email'] == 'test@example.com'
