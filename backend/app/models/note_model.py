from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base
from app.utils.time import utc_now


class RouteNote(Base):
    __tablename__ = 'route_notes'
    __table_args__ = (UniqueConstraint('user_id', 'route_id', name='uq_user_route_note'),)

    note_id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey('users.user_id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    route_id: Mapped[int] = mapped_column(
        ForeignKey('routes.route_id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False, default='')
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utc_now)
