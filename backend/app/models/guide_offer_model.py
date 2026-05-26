from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base
from app.utils.time import utc_now


class GuideOffer(Base):
    """Rehberin bir gezi talebine verdiği teklif."""

    __tablename__ = 'guide_offers'

    offer_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(ForeignKey('trip_requests.request_id'), index=True, nullable=False)
    guide_id: Mapped[int] = mapped_column(ForeignKey('users.user_id'), index=True, nullable=False)

    message: Mapped[str] = mapped_column(Text, default='', nullable=False)
    base_total: Mapped[float] = mapped_column(Float, nullable=False)
    discount_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    offered_total: Mapped[float] = mapped_column(Float, nullable=False)
    offered_per_person: Mapped[float] = mapped_column(Float, nullable=False)

    status: Mapped[str] = mapped_column(
        String(20), default='pending', nullable=False
    )  # pending | accepted | declined | withdrawn

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )
