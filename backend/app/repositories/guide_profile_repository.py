from sqlalchemy import select

from app.models.guide_profile_model import GuideProfile
from app.repositories.base import BaseRepository


class GuideProfileRepository(BaseRepository):
    async def get_by_user_id(self, user_id: int) -> GuideProfile | None:
        result = await self.db.execute(select(GuideProfile).where(GuideProfile.user_id == user_id))
        return result.scalar_one_or_none()

    async def list_verified(self, *, offset: int = 0, limit: int = 50) -> list[GuideProfile]:
        result = await self.db.execute(
            select(GuideProfile)
            .where(GuideProfile.verification_status == 'verified')
            .order_by(GuideProfile.profile_id.asc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_pending_verification(self) -> list[GuideProfile]:
        result = await self.db.execute(
            select(GuideProfile)
            .where(GuideProfile.verification_status.in_(('under_review', 'pending')))
            .order_by(GuideProfile.submitted_at.desc())
        )
        return list(result.scalars().all())

    async def count_verified(self) -> int:
        from sqlalchemy import func

        result = await self.db.execute(
            select(func.count(GuideProfile.profile_id)).where(
                GuideProfile.verification_status == 'verified'
            )
        )
        return int(result.scalar_one())

    async def create(self, profile: GuideProfile) -> GuideProfile:
        self.db.add(profile)
        return await self._commit_refresh(profile)

    async def save(self, profile: GuideProfile) -> GuideProfile:
        return await self._commit_refresh(profile)
