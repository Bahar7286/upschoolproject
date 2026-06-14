import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth_deps import get_current_user_id
from app.core.config import settings
from app.api.dependencies import (
    get_password_reset_service,
    get_premium_request_service,
    get_profile_service,
    get_user_service,
)
from app.core.exceptions import EmailAlreadyExistsError, InvalidCredentialsError, UserNotFoundError
from app.schemas.auth_schema import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
)
from app.schemas.premium_request_schema import PremiumRequestCreate, PremiumRequestStatusResponse
from app.schemas.user_schema import (
    CompleteRouteResponse,
    GamificationResponse,
    LeaderboardResponse,
    RedeemRewardRequest,
    RedeemRewardResponse,
    UserPreferencesUpdate,
    UserResponse,
)
from app.services.premium_request_service import PremiumRequestService
from app.services.profile_service import ProfileService
from app.services.email_service import email_service
from app.services.password_reset_service import PasswordResetService
from app.services.user_service import UserService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    '/register',
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary='Yeni kullanıcı kaydı',
    description=(
        'E-posta benzersiz olmalıdır. Başarılı yanıtta `user_id` ve hemen kullanılabilir '
        '`access_token` (JWT) döner. Hoş geldin bonusu (+100 XP) otomatik uygulanır.'
    ),
)
async def register_user(
    payload: RegisterRequest,
    service: UserService = Depends(get_user_service),
) -> RegisterResponse:
    try:
        return await service.register_account(payload)
    except EmailAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered') from exc


@router.post(
    '/login',
    response_model=LoginResponse,
    summary='Giriş',
    description='E-posta ve şifre ile JWT `access_token` alın.',
)
async def login_user(
    payload: LoginRequest,
    service: UserService = Depends(get_user_service),
) -> LoginResponse:
    try:
        return await service.login(payload)
    except InvalidCredentialsError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid email or password') from exc


@router.post(
    '/forgot-password',
    response_model=ForgotPasswordResponse,
    summary='Şifre sıfırlama talebi',
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    service: PasswordResetService = Depends(get_password_reset_service),
) -> ForgotPasswordResponse:
    message, token = await service.request_reset(payload.email)
    reset_url = None
    if token:
        reset_url = f'{settings.frontend_url}/sifre-sifirla?token={token}'
        sent = email_service.send_password_reset(payload.email, reset_url)
        if not sent:
            logger.warning('Password reset email not sent (smtp_enabled=%s)', settings.smtp_enabled)
        if settings.expose_reset_url_in_response:
            pass
        else:
            reset_url = None
    return ForgotPasswordResponse(message=message, reset_url=reset_url)


@router.post(
    '/reset-password',
    response_model=dict[str, str],
    summary='Yeni şifre belirle',
)
async def reset_password(
    payload: ResetPasswordRequest,
    service: PasswordResetService = Depends(get_password_reset_service),
) -> dict[str, str]:
    try:
        await service.reset_password(payload.token, payload.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {'message': 'Şifreniz güncellendi. Giriş yapabilirsiniz.'}


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
    try:
        return await service.get_user_by_id(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found') from exc


@router.patch(
    '/me/preferences',
    response_model=UserResponse,
    summary='Kişiselleştirme tercihleri',
)
async def update_current_user_preferences(
    payload: UserPreferencesUpdate,
    user_id: int = Depends(get_current_user_id),
    service: ProfileService = Depends(get_profile_service),
) -> UserResponse:
    return await service.update_preferences(user_id, payload)


@router.get(
    '/leaderboard',
    response_model=LeaderboardResponse,
    summary='Haftalık liderlik tablosu (XP)',
)
async def read_leaderboard(
    user_id: int = Depends(get_current_user_id),
    service: ProfileService = Depends(get_profile_service),
) -> LeaderboardResponse:
    return await service.get_leaderboard(viewer_id=user_id)


@router.get(
    '/me/gamification',
    response_model=GamificationResponse,
    summary='Oyunlaştırma istatistikleri',
)
async def read_gamification(
    user_id: int = Depends(get_current_user_id),
    service: ProfileService = Depends(get_profile_service),
) -> GamificationResponse:
    return await service.get_gamification(user_id)


@router.post(
    '/me/rewards/redeem',
    response_model=RedeemRewardResponse,
    summary='XP ile ödül kullan',
)
async def redeem_user_reward(
    payload: RedeemRewardRequest,
    user_id: int = Depends(get_current_user_id),
    service: ProfileService = Depends(get_profile_service),
) -> RedeemRewardResponse:
    return await service.redeem_reward(user_id, payload.reward_id)


@router.post(
    '/me/routes/{route_id}/complete',
    response_model=CompleteRouteResponse,
    summary='Rota tamamlama (XP + rozet)',
)
async def complete_user_route(
    route_id: int,
    user_id: int = Depends(get_current_user_id),
    service: ProfileService = Depends(get_profile_service),
) -> CompleteRouteResponse:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    return await service.complete_route(user_id, route_id)


@router.get(
    '/me/premium-request',
    response_model=PremiumRequestStatusResponse,
    summary='Premium talep durumu',
)
async def premium_request_status(
    user_id: int = Depends(get_current_user_id),
    service: PremiumRequestService = Depends(get_premium_request_service),
) -> PremiumRequestStatusResponse:
    return await service.status(user_id)


@router.post(
    '/me/premium-request',
    status_code=status.HTTP_204_NO_CONTENT,
    summary='Premium erişim talebi gönder',
)
async def submit_premium_request(
    payload: PremiumRequestCreate,
    user_id: int = Depends(get_current_user_id),
    service: PremiumRequestService = Depends(get_premium_request_service),
) -> None:
    try:
        await service.submit(user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
