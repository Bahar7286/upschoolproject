from pydantic import BaseModel, ConfigDict, Field


class StopCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=180)
    description: str = Field(default='', max_length=8000)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    order_index: int = Field(ge=0, default=0)
    audio_url: str | None = Field(default=None, max_length=512)


class StopUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=8000)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    order_index: int | None = Field(default=None, ge=0)
    audio_url: str | None = Field(default=None, max_length=512)


class StopResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    stop_id: int
    route_id: int
    title: str
    description: str
    latitude: float
    longitude: float
    order_index: int
    audio_url: str | None
