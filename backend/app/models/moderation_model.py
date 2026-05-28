from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base
from app.utils.time import utc_now


class ModerationDecision(Base):
    __tablename__ = 'moderation_decisions'

    decision_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    admin_id: Mapped[int] = mapped_column(ForeignKey('users.user_id'), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    reason_codes: Mapped[str] = mapped_column(String(500), default='', nullable=False)
    public_feedback: Mapped[str] = mapped_column(Text, default='', nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utc_now)


class ContentReport(Base):
    __tablename__ = 'content_reports'

    report_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    reporter_user_id: Mapped[int] = mapped_column(ForeignKey('users.user_id'), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    reason: Mapped[str] = mapped_column(String(64), nullable=False)
    details: Mapped[str] = mapped_column(Text, default='', nullable=False)
    status: Mapped[str] = mapped_column(String(20), default='open', nullable=False, index=True)
    admin_id: Mapped[int | None] = mapped_column(ForeignKey('users.user_id'), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utc_now)
