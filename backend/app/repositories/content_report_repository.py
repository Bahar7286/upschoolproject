from sqlalchemy import select

from app.models.moderation_model import ContentReport
from app.repositories.base import BaseRepository


class ContentReportRepository(BaseRepository):
    async def create(self, report: ContentReport) -> ContentReport:
        self.db.add(report)
        return await self._commit_refresh(report)

    async def get_by_id(self, report_id: int) -> ContentReport | None:
        return await self.db.get(ContentReport, report_id)

    async def list_open(self, *, limit: int = 100) -> list[ContentReport]:
        result = await self.db.execute(
            select(ContentReport)
            .where(ContentReport.status == 'open')
            .order_by(ContentReport.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def save(self, report: ContentReport) -> ContentReport:
        return await self._commit_refresh(report)
