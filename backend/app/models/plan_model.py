from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base
from app.utils.time import utc_now


class RoutePlan(Base):
    __tablename__ = 'route_plans'

    plan_id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    route_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    planned_date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    planned_time: Mapped[str] = mapped_column(String(5), nullable=False, default='10:00')
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=120)
    memo: Mapped[str] = mapped_column(Text, nullable=False, default='')
    status: Mapped[str] = mapped_column(String(20), nullable=False, default='planned')
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utc_now)
