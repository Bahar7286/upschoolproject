from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.connection import Base


class User(Base):
    __tablename__ = 'users'

    user_id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(20), default='tourist', nullable=False)
