from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base


class Place(Base):
    """Türkiye POI kataloğu — müze, saray, yemek, konaklama vb."""

    __tablename__ = 'places'

    place_id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(120), nullable=False, default='')
    latitude: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default='')
    tags: Mapped[str] = mapped_column(String(255), nullable=False, default='')
    is_partner: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
