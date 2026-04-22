from pydantic import BaseModel, ConfigDict, Field


class RouteRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    interests: list[str] = Field(default_factory=list)
    duration_minutes: int = Field(ge=15, le=720)
    budget: float = Field(ge=0)


class RouteCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=3, max_length=180)
    city: str = Field(min_length=2, max_length=120)
    estimated_minutes: int = Field(ge=15, le=720)
    price: float = Field(ge=0)
    tags: list[str] = Field(default_factory=list)
    guide_id: int = Field(gt=0)


class RouteUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=3, max_length=180)
    city: str | None = Field(default=None, min_length=2, max_length=120)
    estimated_minutes: int | None = Field(default=None, ge=15, le=720)
    price: float | None = Field(default=None, ge=0)
    tags: list[str] | None = None
    guide_id: int | None = Field(default=None, gt=0)


class RouteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    route_id: int
    title: str
    city: str
    estimated_minutes: int
    price: float
    tags: list[str]
