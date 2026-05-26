from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(default='tourist', pattern='^(tourist|guide)$')


class RegisterResponse(BaseModel):
    user_id: int
    full_name: str
    email: EmailStr
    role: str
    access_token: str
    token_type: str = 'bearer'


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    reset_url: str | None = Field(
        default=None,
        description='Yalnızca geliştirme ortamında; üretimde e-posta servisi kullanılır',
    )


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=16, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)
