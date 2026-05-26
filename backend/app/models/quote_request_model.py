from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base
from app.utils.time import utc_now


class QuoteRequest(Base):
    """Turist ↔ rehber platform içi teklif / mesajlaşma."""

    __tablename__ = 'quote_requests'

    quote_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tourist_id: Mapped[int] = mapped_column(ForeignKey('users.user_id'), index=True, nullable=False)
    guide_id: Mapped[int] = mapped_column(ForeignKey('users.user_id'), index=True, nullable=False)
    route_id: Mapped[int | None] = mapped_column(ForeignKey('routes.route_id'), nullable=True)

    group_size: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    preferred_date: Mapped[str] = mapped_column(String(10), default='', nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(5), default='tr', nullable=False)
    message: Mapped[str] = mapped_column(Text, default='', nullable=False)

    status: Mapped[str] = mapped_column(
        String(20), default='pending', nullable=False
    )  # pending | quoted | accepted | declined

    guide_reply: Mapped[str] = mapped_column(Text, default='', nullable=False)
    quoted_total: Mapped[float | None] = mapped_column(Float, nullable=True)
    quoted_per_person: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
