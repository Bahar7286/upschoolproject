from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_user_service
from app.core.exceptions import EmailAlreadyExistsError, UserNotFoundError
from app.schemas.user_schema import UserCreate, UserListResponse, UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter()


@router.get('', response_model=UserListResponse)
async def list_users(
    role: str | None = Query(default=None, pattern='^(tourist|guide|admin)$'),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    service: UserService = Depends(get_user_service),
) -> UserListResponse:
    return await service.list_users(role=role, offset=offset, limit=limit)


@router.post('', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    try:
        return await service.create_user(payload)
    except EmailAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered') from exc


@router.get('/by-email/{email}', response_model=UserResponse)
async def get_user_by_email(
    email: str,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    try:
        return await service.get_user_by_email(email)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found') from exc


@router.get('/{user_id}', response_model=UserResponse)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    if user_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid user id')
    try:
        return await service.get_user_by_id(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found') from exc


@router.patch('/{user_id}', response_model=UserResponse)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    if user_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid user id')
    try:
        return await service.update_user(user_id, payload)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found') from exc
    except EmailAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered') from exc


@router.delete('/{user_id}', response_model=dict[str, str])
async def delete_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
) -> dict[str, str]:
    if user_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid user id')
    try:
        await service.delete_user(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found') from exc
    return {'status': 'deleted'}
