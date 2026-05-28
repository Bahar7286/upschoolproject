from app.models.district_model import District
from app.repositories.district_repository import DistrictRepository
from app.schemas.district_schema import DistrictResponse


class DistrictService:
    def __init__(self, repository: DistrictRepository) -> None:
        self.repository = repository

    @staticmethod
    def _to_response(d: District) -> DistrictResponse:
        return DistrictResponse(
            district_id=d.district_id,
            city_id=d.city_id,
            name_tr=d.name_tr,
            slug=d.slug,
            center_lat=d.center_lat,
            center_lng=d.center_lng,
        )

    async def list_by_city_id(self, city_id: int) -> list[DistrictResponse]:
        districts = await self.repository.list_by_city_id(city_id)
        return [self._to_response(d) for d in districts]

    async def get_by_id(self, district_id: int) -> DistrictResponse | None:
        d = await self.repository.get_by_id(district_id)
        return self._to_response(d) if d else None

