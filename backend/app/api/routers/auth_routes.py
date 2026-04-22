from fastapi import APIRouter

from app.schemas.auth_schema import LoginRequest, LoginResponse
from app.services.auth_service import login

router = APIRouter()


@router.post('/login', response_model=LoginResponse)
async def login_user(payload: LoginRequest) -> LoginResponse:
    return await login(payload)
