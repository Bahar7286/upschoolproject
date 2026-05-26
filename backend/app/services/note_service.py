from app.core.exceptions import NoteNotFoundError
from app.repositories.note_repository import NoteRepository
from app.schemas.note_schema import NoteResponse, NoteUpsert


class NoteService:
    def __init__(self, repository: NoteRepository) -> None:
        self.repository = repository

    @staticmethod
    def _to_response(note) -> NoteResponse:
        return NoteResponse(
            note_id=note.note_id,
            user_id=note.user_id,
            route_id=note.route_id,
            content=note.content,
            updated_at=note.updated_at.isoformat(),
        )

    async def list_my_notes(self, user_id: int) -> list[NoteResponse]:
        notes = await self.repository.list_by_user(user_id)
        return [self._to_response(n) for n in notes]

    async def get_my_note(self, user_id: int, route_id: int) -> NoteResponse | None:
        note = await self.repository.get_by_user_route(user_id, route_id)
        return self._to_response(note) if note else None

    async def upsert_note(self, user_id: int, route_id: int, payload: NoteUpsert) -> NoteResponse:
        note = await self.repository.upsert(user_id, route_id, payload.content)
        return self._to_response(note)

    async def delete_note(self, user_id: int, route_id: int) -> None:
        deleted = await self.repository.delete_by_user_route(user_id, route_id)
        if not deleted:
            raise NoteNotFoundError(route_id, user_id)
