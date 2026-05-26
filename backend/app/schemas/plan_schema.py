from pydantic import BaseModel, ConfigDict, Field


class PlanCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    route_id: int | None = Field(default=None, gt=0)
    title: str = Field(min_length=2, max_length=180)
    planned_date: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    planned_time: str = Field(default='10:00', pattern=r'^\d{2}:\d{2}$')
    duration_minutes: int = Field(default=120, ge=15, le=720)
    memo: str = Field(default='', max_length=2000)


class PlanUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    route_id: int | None = Field(default=None, gt=0)
    title: str | None = Field(default=None, min_length=2, max_length=180)
    planned_date: str | None = Field(default=None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    planned_time: str | None = Field(default=None, pattern=r'^\d{2}:\d{2}$')
    duration_minutes: int | None = Field(default=None, ge=15, le=720)
    memo: str | None = Field(default=None, max_length=2000)
    status: str | None = Field(default=None, pattern=r'^(planned|completed|cancelled)$')


class PlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan_id: int
    user_id: int
    route_id: int | None
    title: str
    planned_date: str
    planned_time: str
    duration_minutes: int
    memo: str
    status: str
    created_at: str
