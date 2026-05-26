import secrets

import stripe

from app.core.config import settings
from app.core.exceptions import PurchaseNotFoundError, UserNotFoundError
from app.models.purchase_model import Purchase
from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.route_repository import RouteRepository
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
from app.services.profile_service import apply_first_purchase_bonus, award_xp_to_user


class PaymentService:
    def __init__(
        self,
        purchase_repository: PurchaseRepository,
        user_repository: UserRepository,
        route_repository: RouteRepository | None = None,
    ) -> None:
        self.purchases = purchase_repository
        self.users = user_repository
        self.routes = route_repository

    @staticmethod
    def _to_response(purchase: Purchase) -> PurchaseResponse:
        return PurchaseResponse(
            purchase_id=purchase.purchase_id,
            user_id=purchase.user_id,
            route_id=purchase.route_id,
            amount=purchase.amount,
            currency=purchase.currency,
            status=purchase.status,
            transaction_ref=purchase.transaction_ref,
            payment_method=purchase.payment_method,
            offer_id=purchase.offer_id,
            trip_request_id=purchase.trip_request_id,
            stripe_session_id=purchase.stripe_session_id,
        )

    @staticmethod
    def payment_config() -> PaymentConfigResponse:
        return PaymentConfigResponse(
            stripe_enabled=settings.stripe_enabled,
            publishable_key=settings.stripe_publishable_key or None,
        )

    async def _resolve_route_id(self, route_id: int | None) -> int:
        if route_id and route_id > 0:
            if self.routes:
                route = await self.routes.get_by_id(route_id)
                if route:
                    return route.route_id
            return route_id
        if self.routes:
            routes = await self.routes.list_all(limit=1)
            if routes:
                return routes[0].route_id
        return 1

    async def start_checkout(self, payload: CheckoutCreate) -> PurchaseResponse:
        user = await self.users.get_by_id(payload.user_id)
        if not user:
            raise UserNotFoundError(user_id=payload.user_id)

        route_id = await self._resolve_route_id(payload.route_id)
        purchase = Purchase(
            user_id=payload.user_id,
            route_id=route_id,
            amount=round(payload.amount, 2),
            currency=payload.currency.upper(),
            status='pending',
            payment_method=payload.payment_method,
            transaction_ref='',
            offer_id=payload.offer_id,
            trip_request_id=payload.trip_request_id,
        )
        created = await self.purchases.create(purchase)
        return self._to_response(created)

    async def create_stripe_checkout(self, payload: CheckoutCreate) -> StripeCheckoutResponse:
        if not settings.stripe_enabled:
            raise ValueError('Stripe yapılandırılmamış. STRIPE_SECRET_KEY ekleyin.')

        pending = await self.start_checkout(payload)
        stripe.api_key = settings.stripe_secret_key
        currency = payload.currency.lower()
        success = payload.success_url or (
            f'{settings.frontend_url}/odeme/basarili?purchase_id={pending.purchase_id}'
            '&session_id={CHECKOUT_SESSION_ID}'
        )
        success = success.replace('PLACEHOLDER', str(pending.purchase_id))
        cancel = payload.cancel_url or f'{settings.frontend_url}/odeme'

        session = stripe.checkout.Session.create(
            mode='payment',
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': currency,
                        'unit_amount': int(round(payload.amount * 100)),
                        'product_data': {
                            'name': 'Historial Go — Rota / Teklif',
                        },
                    },
                    'quantity': 1,
                },
            ],
            metadata={
                'purchase_id': str(pending.purchase_id),
                'user_id': str(payload.user_id),
            },
            success_url=f'{success}?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=cancel,
        )

        purchase = await self.purchases.get_by_id(pending.purchase_id)
        if purchase:
            purchase.stripe_session_id = session.id
            await self.purchases.save(purchase)

        if not session.url:
            raise ValueError('Stripe oturum URL oluşturulamadı')
        return StripeCheckoutResponse(purchase_id=pending.purchase_id, checkout_url=session.url)

    async def confirm_checkout(self, payload: CheckoutConfirm) -> PurchaseResponse:
        purchase = await self.purchases.get_by_id(payload.purchase_id)
        if not purchase:
            raise PurchaseNotFoundError(payload.purchase_id)
        if purchase.status == 'confirmed':
            return self._to_response(purchase)
        if purchase.status != 'pending':
            raise ValueError('Ödeme oturumu geçersiz durumda')

        if payload.stripe_session_id and settings.stripe_enabled:
            stripe.api_key = settings.stripe_secret_key
            session = stripe.checkout.Session.retrieve(payload.stripe_session_id)
            if session.payment_status != 'paid':
                raise ValueError('Stripe ödemesi henüz onaylanmadı')
            meta_pid = session.metadata.get('purchase_id') if session.metadata else None
            if meta_pid and int(meta_pid) != purchase.purchase_id:
                raise ValueError('Oturum kaydı eşleşmiyor')
            purchase.stripe_session_id = session.id

        purchase.status = 'confirmed'
        purchase.transaction_ref = f'HG-{purchase.purchase_id:06d}-{secrets.token_hex(3).upper()}'
        saved = await self.purchases.save(purchase)

        user = await self.users.get_by_id(purchase.user_id)
        if user:
            if purchase.offer_id:
                await award_xp_to_user(self.users, user, 'offer_accepted', 60)
            else:
                prior = await self.purchases.count_by_user_excluding(purchase.user_id, purchase.purchase_id)
                if prior == 0:
                    await apply_first_purchase_bonus(self.purchases.db, user)

        return self._to_response(saved)

    async def create_purchase(self, payload: PurchaseCreate) -> PurchaseResponse:
        user = await self.users.get_by_id(payload.user_id)
        if not user:
            raise UserNotFoundError(user_id=payload.user_id)

        purchase = Purchase(
            user_id=payload.user_id,
            route_id=payload.route_id,
            amount=payload.amount,
            currency=payload.currency.upper(),
            status='confirmed',
            transaction_ref=f'HG-LEG-{secrets.token_hex(3).upper()}',
        )
        created = await self.purchases.create(purchase)

        prior_count = await self.purchases.count_by_user_excluding(
            payload.user_id,
            created.purchase_id,
        )
        if prior_count == 0:
            await apply_first_purchase_bonus(self.purchases.db, user)

        return self._to_response(created)

    async def list_purchases(self) -> list[PurchaseResponse]:
        items = await self.purchases.list_all()
        return [self._to_response(p) for p in items]

    async def list_user_purchases(self, user_id: int) -> list[PurchaseResponse]:
        items = await self.purchases.list_by_user(user_id)
        return [self._to_response(p) for p in items]

    async def get_purchase_by_id(self, purchase_id: int) -> PurchaseResponse:
        purchase = await self.purchases.get_by_id(purchase_id)
        if not purchase:
            raise PurchaseNotFoundError(purchase_id)
        return self._to_response(purchase)

    async def update_purchase(self, purchase_id: int, payload: PurchaseUpdate) -> PurchaseResponse:
        purchase = await self.purchases.get_by_id(purchase_id)
        if not purchase:
            raise PurchaseNotFoundError(purchase_id)

        data = payload.model_dump(exclude_unset=True)
        if not data:
            return self._to_response(purchase)

        updated = await self.purchases.update_fields(purchase, data)
        return self._to_response(updated)

    async def delete_purchase(self, purchase_id: int) -> None:
        purchase = await self.purchases.get_by_id(purchase_id)
        if not purchase:
            raise PurchaseNotFoundError(purchase_id)
        await self.purchases.delete(purchase)
