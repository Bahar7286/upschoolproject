from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.place_visit_model import PlaceVisit
from app.repositories.base import BaseRepository


class PlaceVisitRepository(BaseRepository):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def upsert_visit(
        self,
        *,
        user_id: int,
        entity_type: str,
        entity_key: str,
        place_name: str,
        city: str,
        source: str,
    ) -> PlaceVisit:
        result = await self.db.execute(
            select(PlaceVisit).where(
                PlaceVisit.user_id == user_id,
                PlaceVisit.entity_type == entity_type,
                PlaceVisit.entity_key == entity_key,
            )
        )
        row = result.scalars().first()
        now = datetime.utcnow()
        if row:
            row.visited_at = now
            row.source = source
            if place_name:
                row.place_name = place_name
            if city:
                row.city = city
            await self.db.commit()
            await self.db.refresh(row)
            return row

        visit = PlaceVisit(
            user_id=user_id,
            entity_type=entity_type,
            entity_key=entity_key,
            place_name=place_name,
            city=city,
            source=source,
            visited_at=now,
        )
        self.db.add(visit)
        return await self._commit_refresh(visit)

    async def count_target_visitors(self, *, entity_type: str, entity_key: str) -> int:
        result = await self.db.execute(
            select(func.count(func.distinct(PlaceVisit.user_id))).where(
                PlaceVisit.entity_type == entity_type,
                PlaceVisit.entity_key == entity_key,
            )
        )
        return int(result.scalar() or 0)

    async def co_visit_counts(
        self,
        *,
        entity_type: str,
        entity_key: str,
        city: str | None,
        limit: int,
    ) -> list[tuple[str, str, str, str, int]]:
        target_users = (
            select(PlaceVisit.user_id)
            .where(
                PlaceVisit.entity_type == entity_type,
                PlaceVisit.entity_key == entity_key,
            )
            .distinct()
            .subquery()
        )
        stmt = (
            select(
                PlaceVisit.entity_type,
                PlaceVisit.entity_key,
                func.max(PlaceVisit.place_name),
                func.max(PlaceVisit.city),
                func.count(func.distinct(PlaceVisit.user_id)),
            )
            .join(target_users, PlaceVisit.user_id == target_users.c.user_id)
            .where(
                ~(
                    (PlaceVisit.entity_type == entity_type)
                    & (PlaceVisit.entity_key == entity_key)
                )
            )
            .group_by(PlaceVisit.entity_type, PlaceVisit.entity_key)
            .order_by(func.count(func.distinct(PlaceVisit.user_id)).desc())
            .limit(limit)
        )
        if city:
            stmt = stmt.where(PlaceVisit.city.ilike(city.strip()))
        result = await self.db.execute(stmt)
        return [(r[0], r[1], r[2] or '', r[3] or '', int(r[4])) for r in result.all()]

    async def bulk_insert_visits(self, visits: list[PlaceVisit]) -> None:
        self.db.add_all(visits)
        await self.db.commit()

    async def has_any_visits(self) -> bool:
        result = await self.db.execute(select(PlaceVisit.visit_id).limit(1))
        return result.first() is not None
