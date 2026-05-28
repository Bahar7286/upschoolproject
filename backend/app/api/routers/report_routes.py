from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_moderation_service
from app.schemas.moderation_schema import ContentReportCreate, ContentReportResponse
from app.services.moderation_service import ModerationService

router = APIRouter()


@router.post('', response_model=ContentReportResponse, status_code=status.HTTP_201_CREATED)
async def create_content_report(
    payload: ContentReportCreate,
    user_id: int = Depends(get_current_user_id),
    service: ModerationService = Depends(get_moderation_service),
) -> ContentReportResponse:
    try:
        return await service.create_report(user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
