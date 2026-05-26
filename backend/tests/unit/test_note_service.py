import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NoteNotFoundError
from app.repositories.note_repository import NoteRepository
from app.repositories.user_repository import UserRepository
from app.schemas.note_schema import NoteUpsert
from app.services.note_service import NoteService

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_note_upsert_and_delete(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    service = NoteService(NoteRepository(db_session))
    saved = await service.upsert_note(
        tourist.user_id,
        route_id=1,
        payload=NoteUpsert(content='İlk not'),
    )
    assert saved.content == 'İlk not'

    again = await service.upsert_note(
        tourist.user_id,
        route_id=1,
        payload=NoteUpsert(content='Güncel not'),
    )
    assert again.content == 'Güncel not'

    listed = await service.list_my_notes(tourist.user_id)
    assert len(listed) >= 1

    fetched = await service.get_my_note(tourist.user_id, route_id=1)
    assert fetched and fetched.content == 'Güncel not'

    await service.delete_note(tourist.user_id, route_id=1)
    with pytest.raises(NoteNotFoundError):
        await service.delete_note(tourist.user_id, route_id=1)
