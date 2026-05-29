from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_favorite_service, get_place_visit_service
from app.core.exceptions import PlaceNotFoundError
from app.schemas.favorite_schema import FavoriteCreate, FavoriteResponse
from app.schemas.place_visit_schema import PlaceVisitCreate
from app.services.favorite_service import FavoriteService
from app.services.place_visit_service import PlaceVisitService

router = APIRouter()


@router.get('', response_model=list[FavoriteResponse])
async def list_favorites(
    user_id: int = Depends(get_current_user_id),
    service: FavoriteService = Depends(get_favorite_service),
) -> list[FavoriteResponse]:
    return await service.list_my_favorites(user_id)


@router.post('', status_code=status.HTTP_204_NO_CONTENT)
async def add_favorite(
    payload: FavoriteCreate,
    user_id: int = Depends(get_current_user_id),
    service: FavoriteService = Depends(get_favorite_service),
    visit_service: PlaceVisitService = Depends(get_place_visit_service),
) -> None:
    await service.add_favorite(user_id, payload)
    if payload.entity_type == 'place':
        try:
            await visit_service.record_visit(
                user_id,
                PlaceVisitCreate(
                    entity_type='place',
                    entity_key=str(payload.entity_id),
                    source='favorite',
                ),
            )
        except (ValueError, PlaceNotFoundError):
            pass


@router.delete('/{entity_type}/{entity_id}', response_model=dict[str, str])
async def delete_favorite(
    entity_type: str,
    entity_id: int,
    user_id: int = Depends(get_current_user_id),
    service: FavoriteService = Depends(get_favorite_service),
) -> dict[str, str]:
    if entity_type not in ('place', 'route'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid entity type')
    if entity_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid entity id')
    ok = await service.remove_favorite(user_id, entity_type, entity_id)
    return {'status': 'deleted' if ok else 'not_found'}

