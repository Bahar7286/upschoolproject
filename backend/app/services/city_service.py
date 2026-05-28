from app.models.city_model import City
from app.repositories.city_repository import CityRepository
from app.schemas.city_schema import CityResponse


class CityService:
    def __init__(self, repository: CityRepository) -> None:
        self.repository = repository

    @staticmethod
    def _to_response(city: City) -> CityResponse:
        return CityResponse(
            city_id=city.city_id,
            name_tr=city.name_tr,
            slug=city.slug,
            plate_code=city.plate_code,
            center_lat=city.center_lat,
            center_lng=city.center_lng,
        )

    async def list_all(self) -> list[CityResponse]:
        cities = await self.repository.list_all()
        return [self._to_response(c) for c in cities]

