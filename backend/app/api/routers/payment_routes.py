from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_payment_service
from app.schemas.payment_schema import PurchaseCreate, PurchaseResponse, PurchaseUpdate
from app.services.payment_service import PaymentService

router = APIRouter()


@router.post('', response_model=PurchaseResponse)
async def create_route_purchase(
    payload: PurchaseCreate,
    service: PaymentService = Depends(get_payment_service),
) -> PurchaseResponse:
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail='Amount must be greater than zero')
    return await service.create_purchase(payload)


@router.get('/users/{user_id}', response_model=list[PurchaseResponse])
async def get_user_purchases(
    user_id: int,
    service: PaymentService = Depends(get_payment_service),
) -> list[PurchaseResponse]:
    if user_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid user id')
    return await service.list_user_purchases(user_id)


@router.get('/{purchase_id}', response_model=PurchaseResponse)
async def get_purchase(
    purchase_id: int,
    service: PaymentService = Depends(get_payment_service),
) -> PurchaseResponse:
    if purchase_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid purchase id')

    purchase = await service.get_purchase_by_id(purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail='Purchase not found')

    return purchase


@router.patch('/{purchase_id}', response_model=PurchaseResponse)
async def patch_purchase(
    purchase_id: int,
    payload: PurchaseUpdate,
    service: PaymentService = Depends(get_payment_service),
) -> PurchaseResponse:
    if purchase_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid purchase id')

    purchase = await service.update_purchase(purchase_id, payload)
    if not purchase:
        raise HTTPException(status_code=404, detail='Purchase not found')

    return purchase


@router.delete('/{purchase_id}', response_model=dict[str, str])
async def delete_purchase(
    purchase_id: int,
    service: PaymentService = Depends(get_payment_service),
) -> dict[str, str]:
    if purchase_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid purchase id')

    deleted = await service.delete_purchase(purchase_id)
    if not deleted:
        raise HTTPException(status_code=404, detail='Purchase not found')

    return {'status': 'deleted'}
