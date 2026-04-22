from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_user_service
from app.schemas.user_schema import UserCreate, UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter()


@router.get('', response_model=list[UserResponse])
async def get_users(service: UserService = Depends(get_user_service)) -> list[UserResponse]:
    return await service.list_users()


@router.post('', response_model=UserResponse)
async def post_user(payload: UserCreate, service: UserService = Depends(get_user_service)) -> UserResponse:
    return await service.create_user(payload)


@router.get('/{user_id}', response_model=UserResponse)
async def get_user(user_id: int, service: UserService = Depends(get_user_service)) -> UserResponse:
    if user_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid user id')

    user = await service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    return user


@router.patch('/{user_id}', response_model=UserResponse)
async def patch_user(
    user_id: int,
    payload: UserUpdate,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    if user_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid user id')

    user = await service.update_user(user_id, payload)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    return user


@router.delete('/{user_id}', response_model=dict[str, str])
async def delete_user(user_id: int, service: UserService = Depends(get_user_service)) -> dict[str, str]:
    if user_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid user id')

    deleted = await service.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail='User not found')

    return {'status': 'deleted'}
