from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.purchase_model import Purchase
from app.schemas.payment_schema import PurchaseCreate, PurchaseResponse, PurchaseUpdate


class PaymentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _to_response(purchase: Purchase) -> PurchaseResponse:
        return PurchaseResponse.model_validate(purchase)

    async def create_purchase(self, payload: PurchaseCreate) -> PurchaseResponse:
        purchase = Purchase(
            user_id=payload.user_id,
            route_id=payload.route_id,
            amount=payload.amount,
            currency=payload.currency.upper(),
            status='confirmed',
        )
        self.db.add(purchase)
        await self.db.commit()
        await self.db.refresh(purchase)
        return self._to_response(purchase)

    async def list_user_purchases(self, user_id: int) -> list[PurchaseResponse]:
        result = await self.db.execute(select(Purchase).where(Purchase.user_id == user_id))
        return [self._to_response(purchase) for purchase in result.scalars().all()]

    async def get_purchase_by_id(self, purchase_id: int) -> PurchaseResponse | None:
        purchase = await self.db.get(Purchase, purchase_id)
        return self._to_response(purchase) if purchase else None

    async def update_purchase(self, purchase_id: int, payload: PurchaseUpdate) -> PurchaseResponse | None:
        purchase = await self.db.get(Purchase, purchase_id)
        if not purchase:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return self._to_response(purchase)

        if 'amount' in update_data:
            purchase.amount = update_data['amount']
        if 'currency' in update_data:
            purchase.currency = update_data['currency'].upper()
        if 'status' in update_data:
            purchase.status = update_data['status']

        await self.db.commit()
        await self.db.refresh(purchase)
        return self._to_response(purchase)

    async def delete_purchase(self, purchase_id: int) -> bool:
        purchase = await self.db.get(Purchase, purchase_id)
        if not purchase:
            return False

        await self.db.delete(purchase)
        await self.db.commit()
        return True
