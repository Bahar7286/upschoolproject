import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routers import ai_routes, auth_routes, guide_routes, payment_routes, route_routes, user_routes
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


app = FastAPI(title='Historial-GO API', lifespan=lifespan)

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
app.include_router(ai_routes.router, prefix='/ai', tags=['ai'])
app.include_router(payment_routes.router, prefix='/payments', tags=['payments'])
app.include_router(guide_routes.router, prefix='/guides', tags=['guides'])


@app.middleware('http')
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers['X-Process-Time'] = f'{(time.perf_counter() - start):.6f}'
    return response


@app.get('/health')
async def healthcheck() -> JSONResponse:
    return JSONResponse(content={'status': 'ok'})
