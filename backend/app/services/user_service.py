from app.core.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    UserNotFoundError,
)
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user_model import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth_schema import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse
from app.schemas.user_schema import UserCreate, UserListResponse, UserResponse, UserUpdate
from app.services.profile_service import apply_welcome_bonus_to_user, user_to_response


class UserService:
    """Kullanıcı kayıt, auth ve CRUD iş mantığı."""

    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    async def register_account(self, payload: RegisterRequest) -> RegisterResponse:
        email = str(payload.email).lower()
        if await self.repository.get_by_email(email):
            raise EmailAlreadyExistsError(email)

        user = User(
            full_name=payload.full_name.strip(),
            email=email,
            role=payload.role,
            password_hash=hash_password(payload.password),
        )
        created = await self.repository.create(user)
        apply_welcome_bonus_to_user(created)
        await self.repository.save(created)

        token = create_access_token(user_id=created.user_id, email=created.email)
        return RegisterResponse(
            user_id=created.user_id,
            full_name=created.full_name,
            email=created.email,
            role=created.role,
            access_token=token,
            token_type='bearer',
        )

    async def login(self, payload: LoginRequest) -> LoginResponse:
        user = await self.repository.get_by_email(str(payload.email).lower())
        if user is None or not user.password_hash:
            raise InvalidCredentialsError()
        if not verify_password(payload.password, user.password_hash):
            raise InvalidCredentialsError()

        token = create_access_token(user_id=user.user_id, email=user.email)
        return LoginResponse(access_token=token, token_type='bearer')

    async def list_users(
        self,
        *,
        role: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> UserListResponse:
        users = await self.repository.list_users(role=role, offset=offset, limit=limit)
        total = await self.repository.count_users(role=role)
        return UserListResponse(
            items=[user_to_response(u) for u in users],
            total=total,
            offset=offset,
            limit=limit,
        )

    async def create_user(self, payload: UserCreate) -> UserResponse:
        email = str(payload.email).lower()
        if await self.repository.get_by_email(email):
            raise EmailAlreadyExistsError(email)

        password_hash = hash_password(payload.password) if payload.password else None
        user = User(
            full_name=payload.full_name.strip(),
            email=email,
            role=payload.role,
            password_hash=password_hash,
        )
        created = await self.repository.create(user)
        return user_to_response(created)

    async def get_user_by_id(self, user_id: int) -> UserResponse:
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id=user_id)
        return user_to_response(user)

    async def get_user_by_email(self, email: str) -> UserResponse:
        user = await self.repository.get_by_email(email.lower())
        if not user:
            raise UserNotFoundError(email=email)
        return user_to_response(user)

    async def update_user(self, user_id: int, payload: UserUpdate) -> UserResponse:
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id=user_id)

        data = payload.model_dump(exclude_unset=True)
        if not data:
            return user_to_response(user)

        if 'email' in data and data['email'] is not None:
            new_email = str(data['email']).lower()
            existing = await self.repository.get_by_email(new_email)
            if existing and existing.user_id != user_id:
                raise EmailAlreadyExistsError(new_email)
            user.email = new_email

        if 'full_name' in data and data['full_name'] is not None:
            user.full_name = data['full_name'].strip()

        if 'role' in data and data['role'] is not None:
            user.role = data['role']

        if 'password' in data and data['password'] is not None:
            user.password_hash = hash_password(data['password'])

        updated = await self.repository.save(user)
        return user_to_response(updated)

    async def delete_user(self, user_id: int) -> None:
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id=user_id)
        await self.repository.delete(user)
