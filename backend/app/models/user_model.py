from sqlalchemy import Boolean, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base


class User(Base):
    __tablename__ = 'users'

    user_id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(20), default='tourist', nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Kişiselleştirme & onboarding
    interests: Mapped[str] = mapped_column(String(500), default='', nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=120, nullable=False)
    budget: Mapped[float] = mapped_column(Float, default=150.0, nullable=False)
    theme_preference: Mapped[str] = mapped_column(String(20), default='system', nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(5), default='tr', nullable=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Gamification
    xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    badges: Mapped[str] = mapped_column(String(500), default='', nullable=False)
    last_active_date: Mapped[str | None] = mapped_column(String(10), nullable=True)
    redeemed_rewards: Mapped[str] = mapped_column(String(1000), default='', nullable=False)
    password_reset_token: Mapped[str | None] = mapped_column(String(64), nullable=True)
    password_reset_expires: Mapped[str | None] = mapped_column(String(30), nullable=True)
