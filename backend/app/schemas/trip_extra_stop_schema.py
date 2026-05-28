from pydantic import BaseModel, ConfigDict, Field


class TripExtraStopCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=180)
    description: str = Field(default='', max_length=8000)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    place_id: int | None = None
    google_place_id: str | None = Field(default=None, max_length=128)
    insert_after_order_index: int | None = Field(
        default=None,
        description='Bu order_index değerinden sonra ekle (birleşik sıra)',
    )


class TripExtraStopResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    extra_stop_id: int
    route_id: int
    title: str
    description: str
    latitude: float
    longitude: float
    order_index: int
    place_id: int | None
    google_place_id: str | None
    is_extra: bool = True
