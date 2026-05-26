from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base
from app.utils.time import utc_now


class TripRequest(Base):
    """Turist gezi / rota talebi — rehberler teklif verir."""

    __tablename__ = 'trip_requests'

    request_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tourist_id: Mapped[int] = mapped_column(ForeignKey('users.user_id'), index=True, nullable=False)
    route_id: Mapped[int | None] = mapped_column(ForeignKey('routes.route_id'), nullable=True)

    title: Mapped[str] = mapped_column(String(180), nullable=False)
    city: Mapped[str] = mapped_column(String(120), default='Istanbul', nullable=False)
    interests: Mapped[str] = mapped_column(String(300), default='', nullable=False)
    group_size: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    preferred_date: Mapped[str] = mapped_column(String(10), default='', nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=120, nullable=False)
    budget: Mapped[float] = mapped_column(Float, default=150.0, nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(5), default='tr', nullable=False)
    message: Mapped[str] = mapped_column(Text, default='', nullable=False)

    # existing | custom — JSON [{place_id, name, order}]
    route_mode: Mapped[str] = mapped_column(String(20), default='existing', nullable=False)
    planned_stops: Mapped[str] = mapped_column(Text, default='[]', nullable=False)

    status: Mapped[str] = mapped_column(
        String(20), default='open', nullable=False
    )  # open | awarded | closed | cancelled

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )
