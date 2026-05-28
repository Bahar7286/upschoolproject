from pydantic import BaseModel, ConfigDict, Field


class AIRecommendationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    interests: list[str] = Field(default_factory=list)
    duration_minutes: int = Field(default=120, ge=15, le=720)
    budget: float = Field(default=150.0, ge=0)
    location_lat: float = Field(default=41.0082, ge=-90, le=90)
    location_lng: float = Field(default=28.9784, ge=-180, le=180)
    max_results: int = Field(default=10, ge=1, le=20)


class AIRecommendationItem(BaseModel):
    route_id: int
    score: float = Field(ge=0, le=1)
    reason: str
    matched_tags: list[str] = Field(default_factory=list)
    fits_budget: bool = True
    fits_duration: bool = True
    source: str = Field(
        default='rules',
        description='llm = OpenRouter/Gemini API; rules = yerel skor motoru',
    )


class AIStatusResponse(BaseModel):
    llm_enabled: bool
    provider: str | None = None
    model: str | None = None
    fallback_mode: str = 'rules'


class GeofenceCheckRequest(BaseModel):
    route_id: int = Field(gt=0)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    radius_m: float = Field(default=20, ge=5, le=100)


class GeofenceCheckResponse(BaseModel):
    triggered: bool
    distance_m: float | None = None
    stop_id: int | None = None
    stop_title: str | None = None
    audio_url: str | None = None
    message: str


class StopNarrationRequest(BaseModel):
    stop_title: str = Field(min_length=2, max_length=180)
    description: str = Field(default='', max_length=4000)
    languages: list[str] = Field(default_factory=lambda: ['tr', 'en', 'de'], max_length=3)


class StopNarrationResponse(BaseModel):
    stop_title: str
    scripts: dict[str, str]
    note: str = ''


class NarrationAudioRequest(BaseModel):
    stop_title: str = Field(min_length=2, max_length=180)
    description: str = Field(default='', max_length=4000)
    language: str = Field(default='tr', pattern='^(tr|en|de)$')


class NarrationAudioResponse(BaseModel):
    stop_title: str
    language: str
    audio_base64: str | None = None
    content_type: str = 'audio/mpeg'
    script: str
    fallback_browser_tts: bool = False


class AssistantMessage(BaseModel):
    role: str = Field(pattern='^(user|assistant)$')
    content: str = Field(min_length=1, max_length=4000)


class AssistantChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    city: str = Field(default='Istanbul', max_length=120)
    district: str = Field(default='', max_length=120)
    interests: list[str] = Field(default_factory=list, max_length=12)
    messages: list[AssistantMessage] = Field(default_factory=list, max_length=20)


class AssistantChatResponse(BaseModel):
    reply: str
    source: str = 'rules'
