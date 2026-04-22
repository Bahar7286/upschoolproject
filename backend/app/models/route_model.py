from sqlalchemy import Float, Integer, String
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
    guide_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
