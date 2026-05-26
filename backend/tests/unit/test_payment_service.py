from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import PurchaseNotFoundError, UserNotFoundError
from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.route_repository import RouteRepository
from app.repositories.user_repository import UserRepository
from app.schemas.payment_schema import CheckoutConfirm, CheckoutCreate
from app.services.payment_service import PaymentService

pytestmark = pytest.mark.unit


def _service(session: AsyncSession) -> PaymentService:
    return PaymentService(
        purchase_repository=PurchaseRepository(session),
        user_repository=UserRepository(session),
        route_repository=RouteRepository(session),
    )


@pytest.mark.asyncio
async def test_pay_u01_payment_config_stripe_disabled() -> None:
    with patch('app.services.payment_service.settings') as mock_settings:
        mock_settings.stripe_enabled = False
        mock_settings.stripe_publishable_key = ''
        cfg = PaymentService.payment_config()
    assert cfg.stripe_enabled is False


@pytest.mark.asyncio
async def test_pay_u02_start_checkout_pending(db_session: AsyncSession) -> None:
    service = _service(db_session)
    user = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert user
    result = await service.start_checkout(
        CheckoutCreate(
            user_id=user.user_id,
            amount=12.5,
            currency='TRY',
            route_id=1,
            card_holder='Test',
            card_last4='4242',
        )
    )
    assert result.status == 'pending'
    assert result.purchase_id >= 1


@pytest.mark.asyncio
async def test_pay_u03_confirm_checkout_confirmed(db_session: AsyncSession) -> None:
    service = _service(db_session)
    user = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert user
    pending = await service.start_checkout(
        CheckoutCreate(
            user_id=user.user_id,
            amount=9.9,
            currency='TRY',
            route_id=1,
            card_holder='Test',
            card_last4='4242',
        )
    )
    confirmed = await service.confirm_checkout(CheckoutConfirm(purchase_id=pending.purchase_id))
    assert confirmed.status == 'confirmed'
    assert confirmed.transaction_ref.startswith('HG-')


@pytest.mark.asyncio
async def test_pay_u04_confirm_idempotent_when_already_confirmed(db_session: AsyncSession) -> None:
    service = _service(db_session)
    user = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert user
    pending = await service.start_checkout(
        CheckoutCreate(
            user_id=user.user_id,
            amount=5.0,
            currency='TRY',
            route_id=1,
            card_holder='Test',
            card_last4='4242',
        )
    )
    first = await service.confirm_checkout(CheckoutConfirm(purchase_id=pending.purchase_id))
    second = await service.confirm_checkout(CheckoutConfirm(purchase_id=pending.purchase_id))
    assert first.transaction_ref == second.transaction_ref
    assert second.status == 'confirmed'


@pytest.mark.asyncio
async def test_pay_u05_stripe_checkout_without_keys_raises(db_session: AsyncSession) -> None:
    service = _service(db_session)
    user = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert user
    with patch('app.services.payment_service.settings') as mock_settings:
        mock_settings.stripe_enabled = False
        with pytest.raises(ValueError, match='Stripe'):
            await service.create_stripe_checkout(
                CheckoutCreate(
                    user_id=user.user_id,
                    amount=10.0,
                    currency='TRY',
                    route_id=1,
                    card_holder='Test',
                    card_last4='4242',
                )
            )


@pytest.mark.asyncio
async def test_pay_u06_stripe_mock_creates_session(db_session: AsyncSession) -> None:
    service = _service(db_session)
    user = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert user
    mock_session = MagicMock()
    mock_session.id = 'cs_test_123'
    mock_session.url = 'https://checkout.stripe.com/test'

    with patch('app.services.payment_service.settings') as mock_settings:
        mock_settings.stripe_enabled = True
        mock_settings.stripe_secret_key = 'sk_test_fake'
        mock_settings.frontend_url = 'http://localhost:5173'
        with patch('stripe.checkout.Session.create', return_value=mock_session):
            result = await service.create_stripe_checkout(
                CheckoutCreate(
                    user_id=user.user_id,
                    amount=15.0,
                    currency='TRY',
                    route_id=1,
                    card_holder='Test',
                    card_last4='4242',
                    success_url='http://localhost:5173/odeme/basarili?purchase_id=PLACEHOLDER',
                )
            )
    assert result.checkout_url == 'https://checkout.stripe.com/test'
    purchase = await PurchaseRepository(db_session).get_by_id(result.purchase_id)
    assert purchase
    assert purchase.stripe_session_id == 'cs_test_123'


@pytest.mark.asyncio
async def test_pay_u07_stripe_unpaid_session_rejected(db_session: AsyncSession) -> None:
    service = _service(db_session)
    user = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert user
    pending = await service.start_checkout(
        CheckoutCreate(
            user_id=user.user_id,
            amount=8.0,
            currency='TRY',
            route_id=1,
            card_holder='Test',
            card_last4='4242',
        )
    )
    mock_session = MagicMock()
    mock_session.payment_status = 'unpaid'
    mock_session.metadata = {'purchase_id': str(pending.purchase_id)}
    mock_session.id = 'cs_unpaid'

    with patch('app.services.payment_service.settings') as mock_settings:
        mock_settings.stripe_enabled = True
        mock_settings.stripe_secret_key = 'sk_test_fake'
        with patch('stripe.checkout.Session.retrieve', return_value=mock_session):
            with pytest.raises(ValueError, match='onaylanmadı'):
                await service.confirm_checkout(
                    CheckoutConfirm(
                        purchase_id=pending.purchase_id,
                        stripe_session_id='cs_unpaid',
                    )
                )


@pytest.mark.asyncio
async def test_pay_confirm_invalid_purchase_raises(db_session: AsyncSession) -> None:
    service = _service(db_session)
    with pytest.raises(PurchaseNotFoundError):
        await service.confirm_checkout(CheckoutConfirm(purchase_id=999_999))


@pytest.mark.asyncio
async def test_pay_legacy_purchase_crud(db_session: AsyncSession) -> None:
    service = _service(db_session)
    user = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert user
    from app.schemas.payment_schema import PurchaseCreate, PurchaseUpdate

    created = await service.create_purchase(
        PurchaseCreate(user_id=user.user_id, route_id=2, amount=3.5, currency='TRY')
    )
    assert created.status == 'confirmed'

    all_items = await service.list_purchases()
    assert len(all_items) >= 1

    user_items = await service.list_user_purchases(user.user_id)
    assert any(p.purchase_id == created.purchase_id for p in user_items)

    fetched = await service.get_purchase_by_id(created.purchase_id)
    assert fetched.purchase_id == created.purchase_id

    updated = await service.update_purchase(
        created.purchase_id,
        PurchaseUpdate(amount=4.0),
    )
    assert updated.amount == 4.0

    await service.delete_purchase(created.purchase_id)
    with pytest.raises(PurchaseNotFoundError):
        await service.get_purchase_by_id(created.purchase_id)


@pytest.mark.asyncio
async def test_pay_start_checkout_unknown_user(db_session: AsyncSession) -> None:
    service = _service(db_session)
    with pytest.raises(UserNotFoundError):
        await service.start_checkout(
            CheckoutCreate(
                user_id=999_999,
                amount=5.0,
                currency='TRY',
                route_id=1,
                card_holder='Test',
                card_last4='4242',
            )
        )


@pytest.mark.asyncio
async def test_pay_confirm_non_pending_raises(db_session: AsyncSession) -> None:
    service = _service(db_session)
    user = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert user
    from app.models.purchase_model import Purchase

    purchase = Purchase(
        user_id=user.user_id,
        route_id=1,
        amount=5.0,
        currency='TRY',
        status='failed',
        transaction_ref='',
    )
    db_session.add(purchase)
    await db_session.commit()
    await db_session.refresh(purchase)
    with pytest.raises(ValueError, match='geçersiz durumda'):
        await service.confirm_checkout(CheckoutConfirm(purchase_id=purchase.purchase_id))
