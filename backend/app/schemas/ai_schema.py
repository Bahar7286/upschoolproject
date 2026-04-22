from pydantic import BaseModel, ConfigDict, Field


class AIRecommendationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    interests: list[str] = Field(default_factory=list)
    location_lat: float = Field(ge=-90, le=90)
    location_lng: float = Field(ge=-180, le=180)
    max_results: int = Field(default=5, ge=1, le=20)


class AIRecommendationItem(BaseModel):
    route_id: int
    score: float = Field(ge=0, le=1)
    reason: str
