from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base


class PlaceVisit(Base):
    """Kullanıcı–mekan ziyaret kaydı (co-visit önerileri için)."""

    __tablename__ = 'place_visits'
    __table_args__ = (
        UniqueConstraint('user_id', 'entity_type', 'entity_key', name='uq_place_visit_user_entity'),
    )

    visit_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    entity_key: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    place_name: Mapped[str] = mapped_column(String(200), nullable=False, default='')
    city: Mapped[str] = mapped_column(String(120), nullable=False, default='')
    source: Mapped[str] = mapped_column(String(30), nullable=False, default='view')
    visited_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
