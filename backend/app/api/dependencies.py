from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.connection import get_db
from app.services.ai_service import AIService
from app.services.payment_service import PaymentService
from app.services.route_service import RouteService
from app.services.stop_service import StopService
from app.services.user_service import UserService


def get_route_service(db: AsyncSession = Depends(get_db)) -> RouteService:
    return RouteService(db=db)


def get_ai_service(route_service: RouteService = Depends(get_route_service)) -> AIService:
    return AIService(route_service=route_service)


def get_payment_service(db: AsyncSession = Depends(get_db)) -> PaymentService:
    return PaymentService(db=db)


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(db=db)


def get_stop_service(db: AsyncSession = Depends(get_db)) -> StopService:
    return StopService(db=db)
