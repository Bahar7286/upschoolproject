from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_user_service, require_admin, require_self_or_admin
from app.core.exceptions import EmailAlreadyExistsError, UserNotFoundError
from app.schemas.user_schema import UserListResponse, UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter()


@router.get('', response_model=UserListResponse)
async def list_users(
    role: str | None = Query(default=None, pattern='^(tourist|guide|admin)$'),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    _: int = Depends(require_admin),
    service: UserService = Depends(get_user_service),
) -> UserListResponse:
    return await service.list_users(role=role, offset=offset, limit=limit)


@router.post('', status_code=status.HTTP_410_GONE)
async def create_user_deprecated() -> None:
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail='Use POST /auth/register to create an account',
    )


@router.get('/by-email/{email}', response_model=UserResponse)
async def get_user_by_email(
    email: str,
    current_id: int = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    try:
        target = await service.get_user_by_email(email)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found') from exc
    await require_self_or_admin(target.user_id, current_id)
    return target


@router.get('/{user_id}', response_model=UserResponse)
async def get_user(
    user_id: int,
    current_id: int = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    if user_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid user id')
    await require_self_or_admin(user_id, current_id)
    try:
        return await service.get_user_by_id(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found') from exc


@router.patch('/{user_id}', response_model=UserResponse)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    current_id: int = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    if user_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid user id')
    await require_self_or_admin(user_id, current_id)
    try:
        return await service.update_user(user_id, payload)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found') from exc
    except EmailAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered') from exc


@router.delete('/{user_id}', response_model=dict[str, str])
async def delete_user(
    user_id: int,
    current_id: int = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
) -> dict[str, str]:
    if user_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid user id')
    await require_self_or_admin(user_id, current_id)
    try:
        await service.delete_user(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found') from exc
    return {'status': 'deleted'}
