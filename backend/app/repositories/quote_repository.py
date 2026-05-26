from sqlalchemy import select

from app.models.quote_request_model import QuoteRequest
from app.repositories.base import BaseRepository


class QuoteRepository(BaseRepository):
    async def get_by_id(self, quote_id: int) -> QuoteRequest | None:
        return await self.db.get(QuoteRequest, quote_id)

    async def list_by_tourist(self, tourist_id: int) -> list[QuoteRequest]:
        result = await self.db.execute(
            select(QuoteRequest)
            .where(QuoteRequest.tourist_id == tourist_id)
            .order_by(QuoteRequest.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_guide(self, guide_id: int) -> list[QuoteRequest]:
        result = await self.db.execute(
            select(QuoteRequest)
            .where(QuoteRequest.guide_id == guide_id)
            .order_by(QuoteRequest.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, quote: QuoteRequest) -> QuoteRequest:
        self.db.add(quote)
        return await self._commit_refresh(quote)

    async def save(self, quote: QuoteRequest) -> QuoteRequest:
        return await self._commit_refresh(quote)
