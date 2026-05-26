from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=2000)


class ReviewUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, min_length=3, max_length=2000)


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    review_id: int
    user_id: int
    route_id: int
    author_name: str
    rating: int
    comment: str
    created_at: str


class ReviewSummary(BaseModel):
    average_rating: float
    review_count: int
