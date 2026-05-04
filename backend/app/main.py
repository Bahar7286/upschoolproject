import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse

from app.api.routers import ai_routes, auth_routes, guide_routes, payment_routes, route_routes, stop_routes, user_routes
from app.db.bootstrap import seed_initial_data
from app.db.connection import Base, SessionLocal, engine
from app import models  # noqa: F401


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        await seed_initial_data(session)

    yield


OPENAPI_TAGS = [
    {'name': 'health', 'description': 'Canlılık / readiness kontrolleri.'},
    {
        'name': 'auth',
        'description': 'Kayıt (`POST /auth/register`), giriş (`POST /auth/login`), oturum (`GET /auth/me`). '
        'JWT: `/docs` üstünden **Authorize** → Bearer token.',
    },
    {'name': 'users', 'description': 'Kullanıcı CRUD; opsiyonel `password` ile şifre atanır (`user_id` otomatik).'},
    {'name': 'routes', 'description': 'Rota listeleme, oluşturma, güncelleme, öneri (`route_id`, `guide_id`).'},
    {'name': 'stops', 'description': 'Rota durakları; yol ` /routes/{route_id}/stops` (`stop_id` ile tek kayıt).'},
    {'name': 'ai', 'description': 'AI öneri ve konum skoru.'},
    {'name': 'payments', 'description': 'Satın alma kayıtları (`purchase_id`, `user_id`, `route_id`).'},
    {'name': 'guides', 'description': 'Rehber kazanç ve ödeme talebi.'},
]

app = FastAPI(
    title='Historial-GO API',
    version='0.1.0',
    description=(
        'Historial-GO turizm pazaryeri backend API. '
        '**Swagger UI:** [`/docs`](/docs) · **OpenAPI JSON:** [`/openapi.json`](/openapi.json)\n\n'
        'Kimlik: önce `POST /auth/register` veya `POST /auth/login` ile `access_token` alın; '
        'korumalı uçlar için `Authorization: Bearer <token>` kullanın.'
    ),
    lifespan=lifespan,
    openapi_tags=OPENAPI_TAGS,
    docs_url='/docs',
    redoc_url='/redoc',
    openapi_url='/openapi.json',
)


def custom_openapi() -> dict:
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        openapi_version='3.1.0',
    )
    components = openapi_schema.setdefault('components', {})
    security_schemes = components.setdefault('securitySchemes', {})
    security_schemes['BearerAuth'] = {
        'type': 'http',
        'scheme': 'bearer',
        'bearerFormat': 'JWT',
        'description': '`access_token` değerini girin (login veya register yanıtı).',
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth_routes.router, prefix='/auth', tags=['auth'])
app.include_router(user_routes.router, prefix='/users', tags=['users'])
app.include_router(route_routes.router, prefix='/routes', tags=['routes'])
app.include_router(stop_routes.router)
app.include_router(ai_routes.router, prefix='/ai', tags=['ai'])
app.include_router(payment_routes.router, prefix='/payments', tags=['payments'])
app.include_router(guide_routes.router, prefix='/guides', tags=['guides'])


@app.middleware('http')
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers['X-Process-Time'] = f'{(time.perf_counter() - start):.6f}'
    return response


@app.get('/health', tags=['health'], summary='Sağlık kontrolü')
async def healthcheck() -> JSONResponse:
    return JSONResponse(content={'status': 'ok'})
