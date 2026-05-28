import time
from collections import defaultdict

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings

_WINDOW_SEC = 60
_MAX_REQUESTS = 120
_AUTH_MAX = 30
_AI_MAX = 20

_buckets: dict[str, list[float]] = defaultdict(list)


def _client_key(request: Request) -> str:
    forwarded = request.headers.get('x-forwarded-for')
    if forwarded:
        return forwarded.split(',')[0].strip()
    if request.client:
        return request.client.host
    return 'unknown'


def _allow(key: str, limit: int) -> bool:
    now = time.time()
    window_start = now - _WINDOW_SEC
    hits = [t for t in _buckets[key] if t >= window_start]
    if len(hits) >= limit:
        _buckets[key] = hits
        return False
    hits.append(now)
    _buckets[key] = hits
    return True


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in ('/health', '/docs', '/redoc', '/openapi.json'):
            return await call_next(request)

        path = request.url.path
        key = _client_key(request)
        limit = _MAX_REQUESTS
        if path.startswith('/auth'):
            limit = _AUTH_MAX
        elif path.startswith('/ai'):
            limit = _AI_MAX

        if not _allow(f'{key}:{path.split("/")[1] if path.startswith("/") else "root"}', limit):
            return JSONResponse(
                status_code=429,
                content={'detail': 'Çok fazla istek gönderdiniz. Lütfen bir dakika sonra tekrar deneyin.'},
            )

        return await call_next(request)
