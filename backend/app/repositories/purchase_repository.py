from sqlalchemy import select

from app.models.purchase_model import Purchase
from app.repositories.base import BaseRepository, apply_update


class PurchaseRepository(BaseRepository):
    async def list_all(self) -> list[Purchase]:
        result = await self.db.execute(select(Purchase).order_by(Purchase.purchase_id.asc()))
        return list(result.scalars().all())

    async def list_by_user(self, user_id: int) -> list[Purchase]:
        result = await self.db.execute(select(Purchase).where(Purchase.user_id == user_id))
        return list(result.scalars().all())

    async def has_confirmed_purchase(self, user_id: int, route_id: int) -> bool:
        result = await self.db.execute(
            select(Purchase.purchase_id).where(
                Purchase.user_id == user_id,
                Purchase.route_id == route_id,
                Purchase.status == 'confirmed',
            ).limit(1),
        )
        return result.first() is not None

    async def get_by_id(self, purchase_id: int) -> Purchase | None:
        return await self.db.get(Purchase, purchase_id)

    async def get_by_stripe_session(self, session_id: str) -> Purchase | None:
        result = await self.db.execute(
            select(Purchase).where(Purchase.stripe_session_id == session_id),
        )
        return result.scalar_one_or_none()

    async def count_by_user_excluding(self, user_id: int, exclude_purchase_id: int) -> int:
        result = await self.db.execute(
            select(Purchase.purchase_id).where(
                Purchase.user_id == user_id,
                Purchase.purchase_id != exclude_purchase_id,
            )
        )
        return len(result.all())

    async def create(self, purchase: Purchase) -> Purchase:
        self.db.add(purchase)
        return await self._commit_refresh(purchase)

    async def save(self, purchase: Purchase) -> Purchase:
        return await self._commit_refresh(purchase)

    async def update_fields(self, purchase: Purchase, data: dict) -> Purchase:
        if 'currency' in data and data['currency']:
            data = {**data, 'currency': str(data['currency']).upper()}
        apply_update(purchase, data)
        return await self.save(purchase)

    async def delete(self, purchase: Purchase) -> None:
        await self.db.delete(purchase)
        await self.db.commit()
