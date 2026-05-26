from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_note_service, get_review_service
from app.core.exceptions import NoteNotFoundError, ReviewAlreadyExistsError, ReviewNotFoundError
from app.schemas.note_schema import NoteResponse, NoteUpsert
from app.schemas.review_schema import ReviewCreate, ReviewResponse, ReviewSummary, ReviewUpdate
from app.services.note_service import NoteService
from app.services.review_service import ReviewService

router = APIRouter()


@router.get('/{route_id}/reviews', response_model=list[ReviewResponse])
async def list_route_reviews(
    route_id: int,
    service: ReviewService = Depends(get_review_service),
) -> list[ReviewResponse]:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    return await service.list_reviews(route_id)


@router.get('/{route_id}/reviews/summary', response_model=ReviewSummary)
async def route_review_summary(
    route_id: int,
    service: ReviewService = Depends(get_review_service),
) -> ReviewSummary:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    return await service.get_summary(route_id)


@router.post('/{route_id}/reviews', response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_route_review(
    route_id: int,
    payload: ReviewCreate,
    user_id: int = Depends(get_current_user_id),
    service: ReviewService = Depends(get_review_service),
) -> ReviewResponse:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    try:
        return await service.create_review(user_id, route_id, payload)
    except ReviewAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Review already exists') from exc


@router.patch('/{route_id}/reviews/{review_id}', response_model=ReviewResponse)
async def update_route_review(
    route_id: int,
    review_id: int,
    payload: ReviewUpdate,
    user_id: int = Depends(get_current_user_id),
    service: ReviewService = Depends(get_review_service),
) -> ReviewResponse:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    try:
        return await service.update_review(review_id, user_id, route_id, payload)
    except ReviewNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Review not found') from exc


@router.delete('/{route_id}/reviews/{review_id}', response_model=dict[str, str])
async def delete_route_review(
    route_id: int,
    review_id: int,
    user_id: int = Depends(get_current_user_id),
    service: ReviewService = Depends(get_review_service),
) -> dict[str, str]:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    try:
        await service.delete_review(review_id, user_id, route_id)
    except ReviewNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Review not found') from exc
    return {'status': 'deleted'}


@router.get('/{route_id}/notes/me', response_model=NoteResponse | None)
async def get_my_route_note(
    route_id: int,
    user_id: int = Depends(get_current_user_id),
    service: NoteService = Depends(get_note_service),
) -> NoteResponse | None:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    return await service.get_my_note(user_id, route_id)


@router.put('/{route_id}/notes/me', response_model=NoteResponse)
async def upsert_my_route_note(
    route_id: int,
    payload: NoteUpsert,
    user_id: int = Depends(get_current_user_id),
    service: NoteService = Depends(get_note_service),
) -> NoteResponse:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    return await service.upsert_note(user_id, route_id, payload)


@router.delete('/{route_id}/notes/me', response_model=dict[str, str])
async def delete_my_route_note(
    route_id: int,
    user_id: int = Depends(get_current_user_id),
    service: NoteService = Depends(get_note_service),
) -> dict[str, str]:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    try:
        await service.delete_note(user_id, route_id)
    except NoteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Note not found') from exc
    return {'status': 'deleted'}
