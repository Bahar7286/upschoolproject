from datetime import timezone

from app.models.favorite_model import Favorite
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.place_repository import PlaceRepository
from app.schemas.favorite_schema import FavoriteCreate, FavoriteResponse
from app.services.place_service import PlaceService


class FavoriteService:
    def __init__(self, repository: FavoriteRepository, place_repo: PlaceRepository) -> None:
        self.repository = repository
        self.places = place_repo

    async def list_my_favorites(self, user_id: int) -> list[FavoriteResponse]:
        items = await self.repository.list_by_user(user_id)
        responses: list[FavoriteResponse] = []
        for fav in items:
            place = None
            if fav.entity_type == 'place':
                p = await self.places.get_by_id(fav.entity_id)
                if p:
                    place = PlaceService._to_response(p)
            created = fav.created_at.replace(tzinfo=timezone.utc).isoformat()
            responses.append(
                FavoriteResponse(
                    entity_type=fav.entity_type,
                    entity_id=fav.entity_id,
                    created_at=created,
                    place=place,
                )
            )
        return responses

    async def add_favorite(self, user_id: int, payload: FavoriteCreate) -> None:
        if await self.repository.exists(
            user_id=user_id,
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
        ):
            return
        fav = Favorite(user_id=user_id, entity_type=payload.entity_type, entity_id=payload.entity_id)
        await self.repository.create(fav)

    async def remove_favorite(self, user_id: int, entity_type: str, entity_id: int) -> bool:
        return await self.repository.delete_one(user_id=user_id, entity_type=entity_type, entity_id=entity_id)

