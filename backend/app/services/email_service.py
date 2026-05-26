import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def send_password_reset(self, to_email: str, reset_url: str) -> bool:
        if not settings.smtp_enabled:
            return False

        message = EmailMessage()
        message['Subject'] = 'Historial-GO — Şifre sıfırlama'
        message['From'] = settings.smtp_from
        message['To'] = to_email
        message.set_content(
            'Historial-GO hesabınız için şifre sıfırlama talebi aldık.\n\n'
            f'Bağlantı (1 saat geçerli):\n{reset_url}\n\n'
            'Bu talebi siz yapmadıysanız bu e-postayı yok sayın.',
        )

        try:
            if settings.smtp_use_tls:
                with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
                    smtp.starttls()
                    if settings.smtp_user:
                        smtp.login(settings.smtp_user, settings.smtp_password)
                    smtp.send_message(message)
            else:
                with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
                    if settings.smtp_user:
                        smtp.login(settings.smtp_user, settings.smtp_password)
                    smtp.send_message(message)
            return True
        except OSError as exc:
            logger.exception('SMTP send failed: %s', exc)
            return False


email_service = EmailService()
