from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base


class Purchase(Base):
    __tablename__ = 'purchases'

    purchase_id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.user_id'), index=True)
    route_id: Mapped[int] = mapped_column(ForeignKey('routes.route_id'), index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default='USD')
    status: Mapped[str] = mapped_column(String(20), nullable=False, default='confirmed')
    transaction_ref: Mapped[str] = mapped_column(String(64), default='', nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), default='card', nullable=False)
    offer_id: Mapped[int | None] = mapped_column(
        ForeignKey('guide_offers.offer_id', ondelete='SET NULL'),
        nullable=True,
    )
    trip_request_id: Mapped[int | None] = mapped_column(
        ForeignKey('trip_requests.request_id', ondelete='SET NULL'),
        nullable=True,
    )
    stripe_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
