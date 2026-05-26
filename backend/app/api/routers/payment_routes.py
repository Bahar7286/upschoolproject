from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import (
    get_payment_service,
    get_trip_request_service,
    get_user_repository,
    require_admin,
    require_self_or_admin,
)
from app.core.exceptions import PurchaseNotFoundError, UserNotFoundError
from app.repositories.user_repository import UserRepository
from app.schemas.payment_schema import (
    CheckoutConfirm,
    CheckoutCreate,
    PaymentConfigResponse,
    PurchaseCreate,
    PurchaseResponse,
    PurchaseUpdate,
    StripeCheckoutResponse,
)
from app.services.payment_service import PaymentService
from app.services.trip_request_service import TripRequestService

router = APIRouter()


async def _require_purchase_owner_or_admin(
    purchase_id: int,
    user_id: int,
    service: PaymentService,
    user_repo: UserRepository,
) -> PurchaseResponse:
    try:
        purchase = await service.get_purchase_by_id(purchase_id)
    except PurchaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Purchase not found') from exc
    user = await user_repo.get_by_id(user_id)
    if user and user.role == 'admin':
        return purchase
    if purchase.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Access denied')
    return purchase


@router.get('/config', response_model=PaymentConfigResponse)
async def payment_config(
    service: PaymentService = Depends(get_payment_service),
) -> PaymentConfigResponse:
    return service.payment_config()


@router.post(
    '/checkout/stripe',
    response_model=StripeCheckoutResponse,
    status_code=status.HTTP_201_CREATED,
)
async def stripe_checkout(
    payload: CheckoutCreate,
    user_id: int = Depends(get_current_user_id),
    service: PaymentService = Depends(get_payment_service),
) -> StripeCheckoutResponse:
    if payload.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='User mismatch')
    try:
        return await service.create_stripe_checkout(payload)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found') from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post('/checkout', response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
async def start_checkout(
    payload: CheckoutCreate,
    user_id: int = Depends(get_current_user_id),
    service: PaymentService = Depends(get_payment_service),
) -> PurchaseResponse:
    if payload.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='User mismatch')
    if payload.card_last4 == '0000':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid card')
    try:
        return await service.start_checkout(payload)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found') from exc


@router.post('/checkout/confirm', response_model=PurchaseResponse)
async def confirm_checkout(
    payload: CheckoutConfirm,
    user_id: int = Depends(get_current_user_id),
    service: PaymentService = Depends(get_payment_service),
    trip_service: TripRequestService = Depends(get_trip_request_service),
) -> PurchaseResponse:
    try:
        purchase = await service.confirm_checkout(payload)
    except PurchaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Purchase not found') from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if purchase.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='User mismatch')

    if payload.accept_offer and purchase.offer_id and purchase.trip_request_id:
        try:
            await trip_service.accept_offer(user_id, purchase.trip_request_id, purchase.offer_id)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Payment ok but offer accept failed',
            ) from exc
    return purchase


@router.post('', response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
async def create_purchase(
    payload: PurchaseCreate,
    _: int = Depends(require_admin),
    service: PaymentService = Depends(get_payment_service),
) -> PurchaseResponse:
    if payload.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Amount must be greater than zero')
    try:
        return await service.create_purchase(payload)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found') from exc


@router.get('', response_model=list[PurchaseResponse])
async def list_purchases(
    _: int = Depends(require_admin),
    service: PaymentService = Depends(get_payment_service),
) -> list[PurchaseResponse]:
    return await service.list_purchases()


@router.get('/users/{user_id}', response_model=list[PurchaseResponse])
async def list_user_purchases(
    user_id: int,
    current_id: int = Depends(get_current_user_id),
    service: PaymentService = Depends(get_payment_service),
) -> list[PurchaseResponse]:
    if user_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid user id')
    await require_self_or_admin(user_id, current_id)
    return await service.list_user_purchases(user_id)


@router.get('/{purchase_id}', response_model=PurchaseResponse)
async def get_purchase(
    purchase_id: int,
    user_id: int = Depends(get_current_user_id),
    service: PaymentService = Depends(get_payment_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> PurchaseResponse:
    if purchase_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid purchase id')
    return await _require_purchase_owner_or_admin(purchase_id, user_id, service, user_repo)


@router.patch('/{purchase_id}', response_model=PurchaseResponse)
async def update_purchase(
    purchase_id: int,
    payload: PurchaseUpdate,
    user_id: int = Depends(get_current_user_id),
    service: PaymentService = Depends(get_payment_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> PurchaseResponse:
    if purchase_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid purchase id')
    await _require_purchase_owner_or_admin(purchase_id, user_id, service, user_repo)
    try:
        return await service.update_purchase(purchase_id, payload)
    except PurchaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Purchase not found') from exc


@router.delete('/{purchase_id}', response_model=dict[str, str])
async def delete_purchase(
    purchase_id: int,
    user_id: int = Depends(get_current_user_id),
    service: PaymentService = Depends(get_payment_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> dict[str, str]:
    if purchase_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid purchase id')
    user = await user_repo.get_by_id(user_id)
    if not user or user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    try:
        await service.delete_purchase(purchase_id)
    except PurchaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Purchase not found') from exc
    return {'status': 'deleted'}
