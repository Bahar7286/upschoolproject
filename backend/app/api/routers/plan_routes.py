from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_plan_service
from app.core.exceptions import PlanNotFoundError
from app.schemas.plan_schema import PlanCreate, PlanResponse, PlanUpdate
from app.services.plan_service import PlanService

router = APIRouter()


@router.get('', response_model=list[PlanResponse])
async def list_plans(
    month: str | None = Query(default=None, pattern=r'^\d{4}-\d{2}$'),
    user_id: int = Depends(get_current_user_id),
    service: PlanService = Depends(get_plan_service),
) -> list[PlanResponse]:
    return await service.list_plans(user_id, month=month)


@router.post('', response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    payload: PlanCreate,
    user_id: int = Depends(get_current_user_id),
    service: PlanService = Depends(get_plan_service),
) -> PlanResponse:
    return await service.create_plan(user_id, payload)


@router.get('/{plan_id}', response_model=PlanResponse)
async def get_plan(
    plan_id: int,
    user_id: int = Depends(get_current_user_id),
    service: PlanService = Depends(get_plan_service),
) -> PlanResponse:
    try:
        return await service.get_plan(plan_id, user_id)
    except PlanNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Plan not found') from exc


@router.patch('/{plan_id}', response_model=PlanResponse)
async def update_plan(
    plan_id: int,
    payload: PlanUpdate,
    user_id: int = Depends(get_current_user_id),
    service: PlanService = Depends(get_plan_service),
) -> PlanResponse:
    try:
        return await service.update_plan(plan_id, user_id, payload)
    except PlanNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Plan not found') from exc


@router.delete('/{plan_id}', response_model=dict[str, str])
async def delete_plan(
    plan_id: int,
    user_id: int = Depends(get_current_user_id),
    service: PlanService = Depends(get_plan_service),
) -> dict[str, str]:
    try:
        await service.delete_plan(plan_id, user_id)
    except PlanNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Plan not found') from exc
    return {'status': 'deleted'}
