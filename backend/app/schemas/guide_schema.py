from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.route_schema import RouteCreate, RouteResponse, RouteUpdate


class GuideCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class GuideUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6, max_length=128)


class GuideResponse(BaseModel):
    guide_id: int
    full_name: str
    email: EmailStr
    role: str = 'guide'
    route_count: int = 0
    xp: int = 0
    badges: list[str] = Field(default_factory=list)


class GuideListResponse(BaseModel):
    items: list[GuideResponse]
    total: int


class GuideEarningsResponse(BaseModel):
    guide_id: int
    monthly_earnings: float
    route_sales: int


class GuideRouteStat(BaseModel):
    route_id: int
    title: str
    sales_count: int
    gross_revenue: float
    guide_net: float


class GuideAnalyticsResponse(BaseModel):
    guide_id: int
    route_count: int
    route_sales: int
    gross_revenue: float
    guide_net: float
    pending_offers: int
    accepted_offers: int
    top_routes: list[GuideRouteStat] = Field(default_factory=list)


class GuidePayoutRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    guide_id: int = Field(gt=0)
    amount: float = Field(gt=0)


class GuidePayoutResponse(BaseModel):
    status: str
    message: str


class GuideRouteCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=3, max_length=180)
    city: str = Field(min_length=2, max_length=120)
    estimated_minutes: int = Field(ge=15, le=720)
    price: float = Field(ge=0)
    tags: list[str] = Field(default_factory=list)


class GuideRouteListResponse(BaseModel):
    guide_id: int
    items: list[RouteResponse]
    total: int
