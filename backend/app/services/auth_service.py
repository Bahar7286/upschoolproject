from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user_model import User
from app.schemas.auth_schema import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse


async def register(session: AsyncSession, payload: RegisterRequest) -> RegisterResponse:
    existing = await session.execute(select(User).where(User.email == str(payload.email)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered')

    user = User(
        full_name=payload.full_name,
        email=str(payload.email),
        role=payload.role,
        password_hash=hash_password(payload.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = create_access_token(user_id=user.user_id, email=user.email)
    return RegisterResponse(
        user_id=user.user_id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        access_token=token,
        token_type='bearer',
    )


async def login(session: AsyncSession, payload: LoginRequest) -> LoginResponse:
    result = await session.execute(select(User).where(User.email == str(payload.email)))
    user = result.scalar_one_or_none()
    if user is None or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid email or password',
        )
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid email or password',
        )

    token = create_access_token(user_id=user.user_id, email=user.email)
    return LoginResponse(access_token=token, token_type='bearer')
