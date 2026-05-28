from pydantic import BaseModel, ConfigDict, Field


class RouteModerationDecision(BaseModel):
    action: str = Field(pattern='^(approve|reject|unpublish)$')
    reason_codes: str = Field(default='', max_length=500)
    public_feedback: str = Field(default='', max_length=2000)


class AdminPendingRoute(BaseModel):
    route_id: int
    title: str
    city: str
    guide_id: int
    status: str
    price: float
    estimated_minutes: int
    submitted_at: str | None


class ContentReportCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    entity_type: str = Field(pattern='^(route|place|review|guide)$')
    entity_id: int = Field(gt=0)
    reason: str = Field(min_length=3, max_length=64)
    details: str = Field(default='', max_length=2000)


class ContentReportResponse(BaseModel):
    report_id: int
    entity_type: str
    entity_id: int
    reason: str
    details: str
    status: str
    created_at: str


class ContentReportResolve(BaseModel):
    status: str = Field(pattern='^(reviewed|dismissed)$')
