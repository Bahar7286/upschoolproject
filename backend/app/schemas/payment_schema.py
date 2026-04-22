from pydantic import BaseModel, ConfigDict, Field


class PurchaseCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user_id: int = Field(gt=0)
    route_id: int = Field(gt=0)
    amount: float = Field(gt=0)
    currency: str = Field(default='USD', min_length=3, max_length=3)


class PurchaseUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    amount: float | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    status: str | None = Field(default=None, pattern='^(pending|confirmed|failed|refunded)$')


class PurchaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    purchase_id: int
    user_id: int
    route_id: int
    amount: float
    currency: str
    status: str
