from sqlalchemy import func, select

from app.models.guide_offer_model import GuideOffer
from app.repositories.base import BaseRepository


class GuideOfferRepository(BaseRepository):
    async def get_by_id(self, offer_id: int) -> GuideOffer | None:
        return await self.db.get(GuideOffer, offer_id)

    async def list_by_request(self, request_id: int) -> list[GuideOffer]:
        result = await self.db.execute(
            select(GuideOffer)
            .where(GuideOffer.request_id == request_id)
            .order_by(GuideOffer.offered_total.asc())
        )
        return list(result.scalars().all())

    async def count_by_request(self, request_id: int) -> int:
        result = await self.db.execute(
            select(func.count(GuideOffer.offer_id)).where(GuideOffer.request_id == request_id)
        )
        return int(result.scalar_one())

    async def get_by_guide_request(self, guide_id: int, request_id: int) -> GuideOffer | None:
        result = await self.db.execute(
            select(GuideOffer).where(
                GuideOffer.guide_id == guide_id,
                GuideOffer.request_id == request_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_guide(self, guide_id: int) -> list[GuideOffer]:
        result = await self.db.execute(
            select(GuideOffer)
            .where(GuideOffer.guide_id == guide_id)
            .order_by(GuideOffer.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, offer: GuideOffer) -> GuideOffer:
        self.db.add(offer)
        return await self._commit_refresh(offer)

    async def save(self, offer: GuideOffer) -> GuideOffer:
        return await self._commit_refresh(offer)

    async def count_for_guide(self, guide_id: int, *, status: str | None = None) -> int:
        stmt = select(func.count(GuideOffer.offer_id)).where(GuideOffer.guide_id == guide_id)
        if status:
            stmt = stmt.where(GuideOffer.status == status)
        result = await self.db.execute(stmt)
        return int(result.scalar_one())
