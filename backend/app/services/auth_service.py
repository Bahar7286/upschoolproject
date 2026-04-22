from app.schemas.auth_schema import LoginRequest, LoginResponse


async def login(payload: LoginRequest) -> LoginResponse:
    token_seed = payload.email.replace('@', '_at_').replace('.', '_')
    return LoginResponse(access_token=f'mock-token-{token_seed}')
