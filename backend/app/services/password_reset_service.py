import secrets
from datetime import datetime, timedelta, timezone

from app.core.security import hash_password, verify_password
from app.repositories.user_repository import UserRepository


class PasswordResetService:
    def __init__(self, user_repository: UserRepository) -> None:
        self.users = user_repository

    async def request_reset(self, email: str) -> tuple[str, str | None]:
        """Returns (message, dev_token). dev_token only for logging in development."""
        user = await self.users.get_by_email(email.lower())
        message = 'E-posta kayıtlıysa sıfırlama bağlantısı gönderildi.'
        if not user:
            return message, None

        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires = (
            datetime.now(timezone.utc) + timedelta(hours=1)
        ).replace(tzinfo=None).isoformat()
        await self.users.save(user)
        return message, token

    async def reset_password(self, token: str, new_password: str) -> None:
        user = await self.users.get_by_reset_token(token)
        if not user or not user.password_reset_expires:
            raise ValueError('Geçersiz veya süresi dolmuş bağlantı')
        try:
            expires = datetime.fromisoformat(user.password_reset_expires)
            if expires.tzinfo is None:
                expires = expires.replace(tzinfo=timezone.utc)
        except ValueError as exc:
            raise ValueError('Geçersiz veya süresi dolmuş bağlantı') from exc
        if datetime.now(timezone.utc) > expires.astimezone(timezone.utc):
            raise ValueError('Bağlantının süresi doldu. Yeniden talep edin.')

        # Aynı şifreyi tekrar kabul etmeyelim (güvenlik + UX).
        if verify_password(new_password, user.password_hash):
            raise ValueError('Yeni şifre eski şifrenizle aynı olamaz.')

        user.password_hash = hash_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        await self.users.save(user)
