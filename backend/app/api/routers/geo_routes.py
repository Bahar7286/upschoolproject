from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_city_service, get_district_service
from app.schemas.google_schema import GeoCenterResponse
from app.services.city_service import CityService
from app.services.district_service import DistrictService

router = APIRouter()


@router.get('/center', response_model=GeoCenterResponse)
async def geo_center(
    city_id: int | None = None,
    district_id: int | None = None,
    cities: CityService = Depends(get_city_service),
    districts: DistrictService = Depends(get_district_service),
) -> GeoCenterResponse:
    """Şehir veya ilçe merkez koordinatı (harita odak)."""
    if district_id and district_id > 0:
        d = await districts.get_by_id(district_id)
        if not d:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='İlçe bulunamadı')
        city = await cities.get_by_id(d.city_id)
        city_name = city.name_tr if city else ''
        lat, lng = d.center_lat, d.center_lng
        if lat == 0.0 and lng == 0.0 and city:
            lat, lng = city.center_lat, city.center_lng
        return GeoCenterResponse(
            lat=lat,
            lng=lng,
            city_name=city_name,
            district_name=d.name_tr,
        )
    if city_id and city_id > 0:
        c = await cities.get_by_id(city_id)
        if not c:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='İl bulunamadı')
        return GeoCenterResponse(lat=c.center_lat, lng=c.center_lng, city_name=c.name_tr)
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail='city_id veya district_id gerekli',
    )
