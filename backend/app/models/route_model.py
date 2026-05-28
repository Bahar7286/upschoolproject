from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base


class Route(Base):
    __tablename__ = 'routes'

    route_id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    estimated_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    tags: Mapped[str] = mapped_column(String(255), nullable=False, default='')
    guide_id: Mapped[int] = mapped_column(
        ForeignKey('users.user_id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default='published',
        index=True,
    )
    seo_description: Mapped[str] = mapped_column(Text, default='', nullable=False)
    moderation_note: Mapped[str] = mapped_column(Text, default='', nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
