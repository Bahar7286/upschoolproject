import logging
import smtplib
from email.message import EmailMessage

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def send_password_reset(self, to_email: str, reset_url: str) -> bool:
        if settings.smtp_enabled:
            return self._send_via_smtp(to_email, reset_url)
        if settings.brevo_enabled:
            return self._send_via_brevo(to_email, reset_url)
        logger.warning('Email disabled: neither SMTP nor BREVO_API_KEY configured')
        return False

    def _send_via_smtp(self, to_email: str, reset_url: str) -> bool:
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
        except Exception as exc:
            logger.exception('SMTP send failed: %s', exc)
            return False

    def _send_via_brevo(self, to_email: str, reset_url: str) -> bool:
        # Brevo Transactional Email API (SMTP yerine HTTP/443) — Render timeout sorunlarını aşar.
        payload = {
            'sender': {'email': settings.smtp_from},
            'to': [{'email': to_email}],
            'subject': 'Historial-GO — Şifre sıfırlama',
            'textContent': (
                'Historial-GO hesabınız için şifre sıfırlama talebi aldık.\n\n'
                f'Bağlantı (1 saat geçerli):\n{reset_url}\n\n'
                'Bu talebi siz yapmadıysanız bu e-postayı yok sayın.'
            ),
        }
        headers = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': settings.brevo_api_key,
        }
        url = f'{settings.brevo_base_url}/v3/smtp/email'
        try:
            resp = httpx.post(url, json=payload, headers=headers, timeout=30)
            resp.raise_for_status()
            return True
        except Exception as exc:
            logger.exception('Brevo API send failed: %s', exc)
            return False


email_service = EmailService()
