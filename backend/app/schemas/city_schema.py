from pydantic import BaseModel, ConfigDict, Field


class CityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    city_id: int
    name_tr: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=120)
    plate_code: str = Field(min_length=2, max_length=2)
    center_lat: float
    center_lng: float
    image_url: str | None = None

