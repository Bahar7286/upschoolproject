from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.premium_request_model import PremiumRequest
from app.repositories.base import BaseRepository


class PremiumRequestRepository(BaseRepository):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def create(self, row: PremiumRequest) -> PremiumRequest:
        self.db.add(row)
        return await self._commit_refresh(row)

    async def get_pending_for_user(self, user_id: int) -> PremiumRequest | None:
        result = await self.db.execute(
            select(PremiumRequest)
            .where(PremiumRequest.user_id == user_id, PremiumRequest.status == 'pending')
            .order_by(PremiumRequest.created_at.desc())
            .limit(1)
        )
        return result.scalars().first()

    async def list_pending(self) -> list[PremiumRequest]:
        result = await self.db.execute(
            select(PremiumRequest)
            .where(PremiumRequest.status == 'pending')
            .order_by(PremiumRequest.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, request_id: int) -> PremiumRequest | None:
        result = await self.db.execute(
            select(PremiumRequest).where(PremiumRequest.request_id == request_id)
        )
        return result.scalars().first()

    async def save(self, row: PremiumRequest) -> PremiumRequest:
        row.reviewed_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(row)
        return row

    async def commit(self) -> None:
        await self.db.commit()
