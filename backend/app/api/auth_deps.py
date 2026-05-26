import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_access_token

bearer_scheme = HTTPBearer(
    scheme_name='BearerAuth',
    description='`/auth/login` veya `/auth/register` ile alınan access_token',
)

optional_bearer = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> int:
    return _decode_sub(credentials.credentials)


async def get_optional_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
) -> int | None:
    if credentials is None:
        return None
    try:
        return _decode_sub(credentials.credentials)
    except HTTPException:
        return None


def _decode_sub(token: str) -> int:
    try:
        payload = decode_access_token(token)
        sub = payload.get('sub')
        if sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid token payload',
            )
        return int(sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid subject in token',
        ) from None
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired token',
        ) from None
