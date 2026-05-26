from pydantic import BaseModel, ConfigDict, Field


class PlannedStop(BaseModel):
    place_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=180)
    order: int = Field(ge=1, le=50)


class TripRequestCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=5, max_length=180)
    city: str = Field(default='Istanbul', min_length=2, max_length=120)
    interests: list[str] = Field(default_factory=list, max_length=12)
    route_id: int | None = Field(default=None, gt=0)
    route_mode: str = Field(default='existing', pattern='^(existing|custom)$')
    planned_stops: list[PlannedStop] = Field(default_factory=list, max_length=20)
    group_size: int = Field(default=2, ge=1, le=100)
    preferred_date: str = Field(min_length=8, max_length=10)
    duration_minutes: int = Field(default=120, ge=30, le=720)
    budget: float = Field(default=150, ge=0)
    preferred_language: str = Field(default='tr', pattern='^(tr|en|de)$')
    message: str = Field(min_length=10, max_length=2000)


class GuideOfferCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    message: str = Field(min_length=5, max_length=2000)
    base_total: float = Field(gt=0, description='Indirim oncesi toplam teklif')


class GuideOfferResponse(BaseModel):
    offer_id: int
    request_id: int
    guide_id: int
    guide_name: str
    is_verified_guide: bool
    message: str
    base_total: float
    discount_rate: float
    discount_label: str
    offered_total: float
    offered_per_person: float
    platform_fee: float
    guide_net_estimate: float
    status: str
    created_at: str


class TripRequestUpdate(BaseModel):
    status: str = Field(pattern='^(cancelled)$')


class TripRequestResponse(BaseModel):
    request_id: int
    tourist_id: int
    tourist_name: str
    route_id: int | None
    route_title: str | None
    route_mode: str
    planned_stops: list[PlannedStop] = Field(default_factory=list)
    title: str
    city: str
    interests: list[str]
    group_size: int
    preferred_date: str
    duration_minutes: int
    budget: float
    preferred_language: str
    message: str
    status: str
    offer_count: int = 0
    offers: list[GuideOfferResponse] = Field(default_factory=list)
    created_at: str
