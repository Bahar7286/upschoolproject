from pydantic import BaseModel, ConfigDict, Field


class QuoteCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    guide_id: int = Field(gt=0)
    route_id: int | None = Field(default=None, gt=0)
    group_size: int = Field(default=1, ge=1, le=100)
    preferred_date: str = Field(min_length=8, max_length=10)
    preferred_language: str = Field(default='tr', pattern='^(tr|en|de)$')
    message: str = Field(min_length=10, max_length=2000)


class QuoteRespond(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    guide_reply: str = Field(min_length=5, max_length=2000)
    quoted_total: float = Field(gt=0)
    status: str = Field(pattern='^(quoted|declined)$')


class QuoteResponse(BaseModel):
    quote_id: int
    tourist_id: int
    tourist_name: str
    guide_id: int
    guide_name: str
    route_id: int | None
    route_title: str | None
    group_size: int
    preferred_date: str
    preferred_language: str
    message: str
    status: str
    guide_reply: str
    quoted_total: float | None
    quoted_per_person: float | None
    created_at: str
    updated_at: str
