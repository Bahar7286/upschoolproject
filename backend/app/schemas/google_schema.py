from pydantic import BaseModel, Field


class GeoCenterResponse(BaseModel):
    lat: float
    lng: float
    city_name: str = ''
    district_name: str = ''


class GooglePlaceSummary(BaseModel):
    place_id: str
    name: str
    lat: float
    lng: float
    address: str = ''
    rating: float | None = None
    user_rating_count: int | None = None
    types: list[str] = Field(default_factory=list)
    google_maps_uri: str = ''
    photo_url: str = ''
    category: str = ''


class GooglePlacesNearbyResponse(BaseModel):
    places: list[GooglePlaceSummary]
    cached: bool = False
    radius_m: float = 0


class GooglePlaceDetailResponse(BaseModel):
    place_id: str
    name: str
    lat: float
    lng: float
    formatted_address: str = ''
    rating: float | None = None
    user_rating_count: int | None = None
    website_uri: str = ''
    google_maps_uri: str = ''
    editorial_summary: str = ''
    opening_hours: str = ''
    types: list[str] = Field(default_factory=list)
    sources: list[dict[str, str]] = Field(default_factory=list)
    photo_url: str = ''
    category: str = ''


class RouteWaypoint(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class ComputeRouteRequest(BaseModel):
    origin_lat: float = Field(ge=-90, le=90)
    origin_lng: float = Field(ge=-180, le=180)
    dest_lat: float = Field(ge=-90, le=90)
    dest_lng: float = Field(ge=-180, le=180)
    travel_mode: str = Field(default='WALK', pattern='^(WALK|DRIVE|BICYCLE|TRANSIT)$')
    waypoints: list[RouteWaypoint] = Field(default_factory=list, max_length=8)


class RouteStep(BaseModel):
    instruction: str = ''
    distance_m: float = 0
    duration_s: int = 0


class ComputeRouteResponse(BaseModel):
    encoded_polyline: str = ''
    distance_m: float = 0
    duration_s: int = 0
    steps: list[RouteStep] = Field(default_factory=list)
