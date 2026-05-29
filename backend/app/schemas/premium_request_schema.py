from pydantic import BaseModel, ConfigDict, Field


class PremiumRequestCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    message: str = Field(default='', max_length=500)


class PremiumRequestStatusResponse(BaseModel):
    has_pending: bool
    is_premium: bool
    last_status: str | None = None


class PremiumRequestItem(BaseModel):
    request_id: int
    user_id: int
    user_name: str
    user_email: str
    status: str
    message: str
    admin_note: str
    created_at: str
    reviewed_at: str | None = None


class PremiumRequestReview(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    action: str = Field(pattern='^(approve|reject)$')
    admin_note: str = Field(default='', max_length=500)
