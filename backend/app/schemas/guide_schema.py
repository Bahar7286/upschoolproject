from pydantic import BaseModel, ConfigDict, Field


class GuideEarningsResponse(BaseModel):
    guide_id: int
    monthly_earnings: float
    route_sales: int


class GuidePayoutRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    guide_id: int = Field(gt=0)
    amount: float = Field(gt=0)
