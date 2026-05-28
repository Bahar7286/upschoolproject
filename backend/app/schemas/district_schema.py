from pydantic import BaseModel, ConfigDict, Field


class DistrictResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    district_id: int
    city_id: int
    name_tr: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=1, max_length=120)
    center_lat: float
    center_lng: float

