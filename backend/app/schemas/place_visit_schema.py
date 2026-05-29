from pydantic import BaseModel, ConfigDict, Field


VISIT_SOURCES = ('view', 'geofence', 'favorite', 'narration', 'route')
VISIT_ENTITY_TYPES = ('place', 'google_place')


class PlaceVisitCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    entity_type: str = Field(description='place veya google_place')
    entity_key: str = Field(min_length=1, max_length=255)
    place_name: str = Field(default='', max_length=200)
    city: str = Field(default='', max_length=120)
    source: str = Field(default='view')


class AlsoVisitedItem(BaseModel):
    entity_type: str
    entity_key: str
    place_id: int | None = None
    google_place_id: str | None = None
    name: str
    city: str = ''
    category: str | None = None
    image_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    co_visit_count: int = Field(ge=0)
    co_visit_percent: float = Field(ge=0, le=100)


class AlsoVisitedResponse(BaseModel):
    entity_type: str
    entity_key: str
    source_place_name: str = ''
    total_visitors: int = Field(ge=0)
    items: list[AlsoVisitedItem]
