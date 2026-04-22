from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    role: str = Field(default='tourist', pattern='^(tourist|guide|admin)$')


class UserUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    role: str | None = Field(default=None, pattern='^(tourist|guide|admin)$')


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    email: EmailStr
    role: str
