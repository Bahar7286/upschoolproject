from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_model import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    """Kullanıcı veri erişim katmanı."""

    async def list_users(
        self,
        *,
        role: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> list[User]:
        stmt = select(User).order_by(User.user_id.asc()).offset(offset).limit(min(limit, 500))
        if role:
            stmt = stmt.where(User.role == role)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count_users(self, *, role: str | None = None) -> int:
        stmt = select(func.count(User.user_id))
        if role:
            stmt = stmt.where(User.role == role)
        result = await self.db.execute(stmt)
        return int(result.scalar_one())

    async def get_by_id(self, user_id: int) -> User | None:
        return await self.db.get(User, user_id)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()

    async def get_by_reset_token(self, token: str) -> User | None:
        result = await self.db.execute(select(User).where(User.password_reset_token == token))
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def save(self, user: User) -> User:
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def delete(self, user: User) -> None:
        await self.db.delete(user)
        await self.db.commit()

    async def top_by_xp(self, *, limit: int = 10, role: str | None = 'tourist') -> list[User]:
        stmt = select(User).order_by(User.xp.desc(), User.user_id.asc()).limit(min(limit, 50))
        if role:
            stmt = stmt.where(User.role == role)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def rank_by_xp(self, user_id: int, *, role: str | None = 'tourist') -> int:
        user = await self.get_by_id(user_id)
        if not user:
            return 0
        stmt = select(func.count(User.user_id)).where(User.xp > user.xp)
        if role:
            stmt = stmt.where(User.role == role)
        result = await self.db.execute(stmt)
        return int(result.scalar_one()) + 1
