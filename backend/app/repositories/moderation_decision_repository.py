from sqlalchemy import select

from app.models.moderation_model import ModerationDecision
from app.repositories.base import BaseRepository


class ModerationDecisionRepository(BaseRepository):
    async def create(self, decision: ModerationDecision) -> ModerationDecision:
        self.db.add(decision)
        return await self._commit_refresh(decision)

    async def list_by_route(self, route_id: int) -> list[ModerationDecision]:
        result = await self.db.execute(
            select(ModerationDecision)
            .where(
                ModerationDecision.entity_type == 'route',
                ModerationDecision.entity_id == route_id,
            )
            .order_by(ModerationDecision.created_at.desc())
        )
        return list(result.scalars().all())
