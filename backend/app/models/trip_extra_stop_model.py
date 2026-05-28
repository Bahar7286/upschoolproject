from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base


class TripExtraStop(Base):
    """Gezginin aktif rotasına gezi sırasında eklediği kişisel duraklar."""

    __tablename__ = 'trip_extra_stops'

    extra_stop_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('users.user_id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    route_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('routes.route_id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default='')
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    place_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    google_place_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
