import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmailAlreadyExistsError, InvalidCredentialsError, UserNotFoundError
from app.repositories.user_repository import UserRepository
from app.schemas.auth_schema import LoginRequest, RegisterRequest
from app.schemas.user_schema import UserCreate, UserUpdate
from app.services.user_service import UserService

pytestmark = pytest.mark.unit


def _service(session: AsyncSession) -> UserService:
    return UserService(UserRepository(session))


@pytest.mark.asyncio
async def test_register_and_login(db_session: AsyncSession) -> None:
    service = _service(db_session)
    reg = await service.register_account(
        RegisterRequest(
            full_name='New User',
            email='register.unit@example.com',
            password='secret123',
            role='tourist',
        )
    )
    assert reg.access_token
    login = await service.login(
        LoginRequest(email='register.unit@example.com', password='secret123')
    )
    assert login.access_token


@pytest.mark.asyncio
async def test_register_duplicate_email(db_session: AsyncSession) -> None:
    with pytest.raises(EmailAlreadyExistsError):
        await _service(db_session).register_account(
            RegisterRequest(
                full_name='Dup',
                email='tourist@example.com',
                password='secret12',
                role='tourist',
            )
        )


@pytest.mark.asyncio
async def test_login_invalid_password(db_session: AsyncSession) -> None:
    with pytest.raises(InvalidCredentialsError):
        await _service(db_session).login(
            LoginRequest(email='tourist@example.com', password='wrong-password')
        )


@pytest.mark.asyncio
async def test_list_users_with_role_filter(db_session: AsyncSession) -> None:
    result = await _service(db_session).list_users(role='guide', limit=5)
    assert result.total >= 1
    assert all(u.role == 'guide' for u in result.items)


@pytest.mark.asyncio
async def test_create_get_update_delete_user(db_session: AsyncSession) -> None:
    service = _service(db_session)
    created = await service.create_user(
        UserCreate(
            full_name='CRUD User',
            email='crud.user@example.com',
            role='tourist',
            password='pass1234',
        )
    )
    fetched = await service.get_user_by_id(created.user_id)
    assert fetched.email == 'crud.user@example.com'

    updated = await service.update_user(
        created.user_id,
        UserUpdate(full_name='CRUD Updated', password='newpass99'),
    )
    assert updated.full_name == 'CRUD Updated'

    await service.delete_user(created.user_id)
    with pytest.raises(UserNotFoundError):
        await service.get_user_by_id(created.user_id)


@pytest.mark.asyncio
async def test_update_user_email_conflict(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    assert tourist and guide
    with pytest.raises(EmailAlreadyExistsError):
        await _service(db_session).update_user(
            tourist.user_id,
            UserUpdate(email=guide.email),
        )


@pytest.mark.asyncio
async def test_get_user_by_email_not_found(db_session: AsyncSession) -> None:
    with pytest.raises(UserNotFoundError):
        await _service(db_session).get_user_by_email('nobody@example.com')


@pytest.mark.asyncio
async def test_update_user_no_changes_returns_same(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    result = await _service(db_session).update_user(tourist.user_id, UserUpdate())
    assert result.user_id == tourist.user_id


@pytest.mark.asyncio
async def test_create_user_without_password(db_session: AsyncSession) -> None:
    created = await _service(db_session).create_user(
        UserCreate(
            full_name='No Pass',
            email='nopass@example.com',
            role='tourist',
            password=None,
        )
    )
    assert created.email == 'nopass@example.com'
