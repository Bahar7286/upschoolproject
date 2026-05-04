from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_db, get_user_service
from app.schemas.auth_schema import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse
from app.schemas.user_schema import UserResponse
from app.services.auth_service import login, register
from app.services.user_service import UserService

router = APIRouter()


@router.post(
    '/register',
    response_model=RegisterResponse,
    status_code=status.HTTP_200_OK,
    summary='Yeni kullanıcı kaydı',
    description=(
        'E-posta benzersiz olmalıdır. Başarılı yanıtta `user_id` ve hemen kullanılabilir '
        '`access_token` (JWT) döner.'
    ),
)
async def register_user(
    payload: RegisterRequest,
    session: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    return await register(session, payload)


@router.post(
    '/login',
    response_model=LoginResponse,
    summary='Giriş',
    description='E-posta ve şifre ile JWT `access_token` alın.',
)
async def login_user(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_db),
) -> LoginResponse:
    return await login(session, payload)


@router.get(
    '/me',
    response_model=UserResponse,
    summary='Oturumdaki kullanıcı',
    description='`Authorization: Bearer <access_token>` gerekir. Swagger’da **Authorize** ile token girin.',
)
async def read_current_user(
    user_id: int = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    user = await service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return user
