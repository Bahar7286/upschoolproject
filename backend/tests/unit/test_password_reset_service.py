from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password
from app.repositories.user_repository import UserRepository
from app.services.password_reset_service import PasswordResetService

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_auth_u01_unknown_email_no_token(db_session: AsyncSession) -> None:
    service = PasswordResetService(UserRepository(db_session))
    message, token = await service.request_reset('nobody@example.com')
    assert 'sıfırlama' in message.lower() or 'E-posta' in message
    assert token is None


@pytest.mark.asyncio
async def test_auth_u02_registered_email_sets_token(db_session: AsyncSession) -> None:
    service = PasswordResetService(UserRepository(db_session))
    message, token = await service.request_reset('tourist@example.com')
    assert token
    user = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert user
    assert user.password_reset_token == token
    assert user.password_reset_expires


@pytest.mark.asyncio
async def test_auth_u03_valid_token_updates_password(db_session: AsyncSession) -> None:
    repo = UserRepository(db_session)
    service = PasswordResetService(repo)
    _, token = await service.request_reset('tourist@example.com')
    assert token
    await service.reset_password(token, 'newpass99')
    user = await repo.get_by_email('tourist@example.com')
    assert user
    assert user.password_reset_token is None
    assert user.password_reset_expires is None
    assert verify_password('newpass99', user.password_hash or '')


@pytest.mark.asyncio
async def test_auth_u03b_reuse_same_password_rejected(db_session: AsyncSession) -> None:
    repo = UserRepository(db_session)
    service = PasswordResetService(repo)
    user = await repo.get_by_email('tourist@example.com')
    assert user and user.password_hash

    _, token = await service.request_reset('tourist@example.com')
    assert token
    with pytest.raises(ValueError, match='aynı olamaz'):
        await service.reset_password(token, 'demo123')


@pytest.mark.asyncio
async def test_auth_u04_expired_token_raises(db_session: AsyncSession) -> None:
    repo = UserRepository(db_session)
    service = PasswordResetService(repo)
    user = await repo.get_by_email('tourist@example.com')
    assert user
    user.password_reset_token = 'expired-token-test'
    user.password_reset_expires = (datetime.now(timezone.utc) - timedelta(hours=2)).replace(
        tzinfo=None
    ).isoformat()
    await repo.save(user)
    with pytest.raises(ValueError, match='süresi doldu|Geçersiz'):
        await service.reset_password('expired-token-test', 'newpass99')


@pytest.mark.asyncio
async def test_auth_u05_invalid_token_raises(db_session: AsyncSession) -> None:
    service = PasswordResetService(UserRepository(db_session))
    with pytest.raises(ValueError, match='Geçersiz'):
        await service.reset_password('totally-invalid-token-xyz', 'newpass99')
