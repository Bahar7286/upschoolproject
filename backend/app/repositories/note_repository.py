from sqlalchemy import select

from app.models.note_model import RouteNote
from app.repositories.base import BaseRepository
from app.utils.time import utc_now


class NoteRepository(BaseRepository):
    async def get_by_user_route(self, user_id: int, route_id: int) -> RouteNote | None:
        result = await self.db.execute(
            select(RouteNote).where(
                RouteNote.user_id == user_id,
                RouteNote.route_id == route_id,
            )
        )
        return result.scalar_one_or_none()

    async def upsert(self, user_id: int, route_id: int, content: str) -> RouteNote:
        note = await self.get_by_user_route(user_id, route_id)
        if note:
            note.content = content
            note.updated_at = utc_now()
        else:
            note = RouteNote(user_id=user_id, route_id=route_id, content=content)
            self.db.add(note)
        return await self._commit_refresh(note)

    async def list_by_user(self, user_id: int) -> list[RouteNote]:
        result = await self.db.execute(
            select(RouteNote)
            .where(RouteNote.user_id == user_id)
            .order_by(RouteNote.updated_at.desc())
        )
        return list(result.scalars().all())

    async def delete_by_user_route(self, user_id: int, route_id: int) -> bool:
        note = await self.get_by_user_route(user_id, route_id)
        if not note:
            return False
        await self.db.delete(note)
        await self.db.commit()
        return True
