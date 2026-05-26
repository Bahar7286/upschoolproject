from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base


class GuideProfile(Base):
    """6326 sayılı Kanun kapsamında doğrulanmış rehber profili (platform içi)."""

    __tablename__ = 'guide_profiles'

    profile_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.user_id'), unique=True, index=True, nullable=False)

    verification_status: Mapped[str] = mapped_column(
        String(20), default='pending', nullable=False
    )  # pending | under_review | verified | rejected

    license_number: Mapped[str] = mapped_column(String(64), default='', nullable=False)
    license_type: Mapped[str] = mapped_column(String(20), default='regional', nullable=False)
    university: Mapped[str] = mapped_column(String(180), default='', nullable=False)
    department: Mapped[str] = mapped_column(String(180), default='', nullable=False)
    graduation_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    languages: Mapped[str] = mapped_column(String(200), default='tr', nullable=False)
    regions: Mapped[str] = mapped_column(String(200), default='Istanbul', nullable=False)
    document_summary: Mapped[str] = mapped_column(Text, default='', nullable=False)

    bio: Mapped[str] = mapped_column(Text, default='', nullable=False)
    specialties: Mapped[str] = mapped_column(String(300), default='', nullable=False)

    min_group_size: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_group_size: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    base_price_per_person: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    rejection_reason: Mapped[str] = mapped_column(String(500), default='', nullable=False)
    document_path: Mapped[str] = mapped_column(String(500), default='', nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
