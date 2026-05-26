from fastapi import APIRouter, Depends

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_note_service
from app.schemas.note_schema import NoteResponse
from app.services.note_service import NoteService

router = APIRouter()


@router.get('/me', response_model=list[NoteResponse])
async def list_my_notes(
    user_id: int = Depends(get_current_user_id),
    service: NoteService = Depends(get_note_service),
) -> list[NoteResponse]:
    return await service.list_my_notes(user_id)
