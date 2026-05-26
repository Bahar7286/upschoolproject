from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_quote_service
from app.core.exceptions import GuideNotFoundError, GuideNotVerifiedError, QuoteNotFoundError
from app.repositories.user_repository import UserRepository
from app.api.dependencies import get_user_repository
from app.schemas.quote_schema import QuoteCreate, QuoteRespond, QuoteResponse
from app.services.quote_service import QuoteService

router = APIRouter()


async def _require_tourist(user_id: int, user_repo: UserRepository) -> None:
    user = await user_repo.get_by_id(user_id)
    if not user or user.role != 'tourist':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Tourist account required')


async def _require_guide(user_id: int, user_repo: UserRepository) -> None:
    user = await user_repo.get_by_id(user_id)
    if not user or user.role != 'guide':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Guide account required')


@router.post('', response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def create_quote(
    payload: QuoteCreate,
    user_id: int = Depends(get_current_user_id),
    service: QuoteService = Depends(get_quote_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> QuoteResponse:
    await _require_tourist(user_id, user_repo)
    try:
        return await service.create_quote(user_id, payload)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc
    except GuideNotVerifiedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Only verified licensed guides accept quote requests',
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get('/sent', response_model=list[QuoteResponse])
async def list_sent_quotes(
    user_id: int = Depends(get_current_user_id),
    service: QuoteService = Depends(get_quote_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> list[QuoteResponse]:
    await _require_tourist(user_id, user_repo)
    return await service.list_sent(user_id)


@router.get('/inbox', response_model=list[QuoteResponse])
async def list_inbox_quotes(
    user_id: int = Depends(get_current_user_id),
    service: QuoteService = Depends(get_quote_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> list[QuoteResponse]:
    await _require_guide(user_id, user_repo)
    return await service.list_inbox(user_id)


@router.patch('/{quote_id}/respond', response_model=QuoteResponse)
async def respond_to_quote(
    quote_id: int,
    payload: QuoteRespond,
    user_id: int = Depends(get_current_user_id),
    service: QuoteService = Depends(get_quote_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> QuoteResponse:
    await _require_guide(user_id, user_repo)
    if quote_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid quote id')
    try:
        return await service.respond(user_id, quote_id, payload)
    except QuoteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Quote not found') from exc
