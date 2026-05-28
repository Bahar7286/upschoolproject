from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base


class District(Base):
    __tablename__ = 'districts'

    district_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    city_id: Mapped[int] = mapped_column(Integer, ForeignKey('cities.city_id'), nullable=False, index=True)

    name_tr: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    center_lat: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    center_lng: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

