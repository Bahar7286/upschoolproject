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
