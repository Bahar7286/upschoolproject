from pydantic import BaseModel, ConfigDict, Field


PLACE_CATEGORIES = [
    'museum',
    'palace',
    'historical',
    'mosque',
    'bazaar',
    'street',
    'restaurant',
    'accommodation',
]


class PlaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    place_id: int
    name: str
    category: str
    city: str
    district: str
    latitude: float
    longitude: float
    description: str
    tags: list[str]
    is_partner: bool
    image_url: str | None = None


class PlaceNearbyResponse(PlaceResponse):
    distance_m: float = Field(ge=0)


class PlaceCategoryCount(BaseModel):
    category: str
    count: int


class PlaceCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=200)
    category: str
    city: str = Field(default='Istanbul', min_length=2, max_length=120)
    district: str = Field(default='', max_length=120)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    description: str = Field(default='', max_length=8000)
    tags: list[str] = Field(default_factory=list, max_length=20)
    is_partner: bool = False


class PlaceUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=2, max_length=200)
    category: str | None = None
    city: str | None = Field(default=None, min_length=2, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    description: str | None = Field(default=None, max_length=8000)
    tags: list[str] | None = Field(default=None, max_length=20)
    is_partner: bool | None = None
