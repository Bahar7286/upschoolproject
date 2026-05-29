from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_city_service, get_district_service
from app.schemas.city_schema import CityResponse
from app.schemas.district_schema import DistrictResponse
from app.services.city_service import CityService
from app.services.district_service import DistrictService

router = APIRouter()


@router.get('', response_model=list[CityResponse])
async def list_cities(service: CityService = Depends(get_city_service)) -> list[CityResponse]:
    return await service.list_all()


@router.get('/{city_id}/districts', response_model=list[DistrictResponse])
async def list_city_districts(
    city_id: int,
    cities: CityService = Depends(get_city_service),
    districts: DistrictService = Depends(get_district_service),
) -> list[DistrictResponse]:
    if city_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid city id')
    city = await cities.get_by_id(city_id)
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='City not found')
    return await districts.list_by_city_id(city_id)

