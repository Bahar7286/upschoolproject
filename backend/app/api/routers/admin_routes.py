from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_guide_profile_service, get_user_repository
from app.core.exceptions import GuideNotFoundError
from app.repositories.user_repository import UserRepository
from app.services.guide_profile_service import GuideProfileService

router = APIRouter()


class AdminGuideAction(BaseModel):
    action: str = Field(pattern='^(verify|reject)$')
    rejection_reason: str = Field(default='', max_length=500)


class AdminPendingGuide(BaseModel):
    guide_id: int
    full_name: str
    email: str
    verification_status: str
    license_number: str
    university: str
    department: str
    document_path: str
    document_summary: str
    submitted_at: str | None


async def _require_admin(user_id: int, user_repo: UserRepository) -> None:
    user = await user_repo.get_by_id(user_id)
    if not user or user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')


@router.get('/guides/pending', response_model=list[AdminPendingGuide])
async def list_pending_guides(
    user_id: int = Depends(get_current_user_id),
    service: GuideProfileService = Depends(get_guide_profile_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> list[AdminPendingGuide]:
    await _require_admin(user_id, user_repo)
    rows = await service.list_pending_for_admin()
    return [AdminPendingGuide(**row) for row in rows]


@router.patch('/guides/{guide_id}/verification', response_model=dict[str, str])
async def moderate_guide(
    guide_id: int,
    payload: AdminGuideAction,
    user_id: int = Depends(get_current_user_id),
    service: GuideProfileService = Depends(get_guide_profile_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> dict[str, str]:
    await _require_admin(user_id, user_repo)
    try:
        status_value = await service.moderate_verification(
            guide_id,
            action=payload.action,
            rejection_reason=payload.rejection_reason,
        )
        return {'status': status_value}
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc
