import os
from pathlib import Path

from dotenv import load_dotenv

# connection.py'den önce import edilebilir — .env burada yüklenir
load_dotenv(Path(__file__).resolve().parents[2] / '.env')


class Settings:
    """Uygulama, JWT ve ödeme ayarları."""

    # HS256 için en az 32 bayt önerilir (pytest InsecureKeyLengthWarning önlemi)
    jwt_secret_key: str = os.getenv(
        'JWT_SECRET_KEY',
        'dev-only-change-me-in-production-32b',
    )
    jwt_algorithm: str = 'HS256'
    access_token_expire_minutes: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440'))

    stripe_secret_key: str = os.getenv('STRIPE_SECRET_KEY', '')
    stripe_publishable_key: str = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
    frontend_url: str = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')

    cors_origins: list[str] = [
        o.strip()
        for o in os.getenv(
            'CORS_ORIGINS',
            'http://localhost:5173,http://127.0.0.1:5173',
        ).split(',')
        if o.strip()
    ]

    # LLM — OpenRouter (önerilen, örn. Gemma) veya doğrudan Google Gemini API
    llm_provider: str = os.getenv('LLM_PROVIDER', 'openrouter').strip().lower()
    openrouter_api_key: str = os.getenv('OPENROUTER_API_KEY', '')
    openrouter_model: str = os.getenv(
        'OPENROUTER_MODEL',
        'google/gemma-4-31b-it:free',
    )
    openrouter_base_url: str = os.getenv(
        'OPENROUTER_BASE_URL',
        'https://openrouter.ai/api/v1',
    )
    gemini_api_key: str = os.getenv('GEMINI_API_KEY', '')
    gemini_model: str = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
    llm_timeout_seconds: float = float(os.getenv('LLM_TIMEOUT_SECONDS', '45'))

    environment: str = os.getenv('ENVIRONMENT', 'development').strip().lower()
    upload_dir: Path = Path(
        os.getenv(
            'UPLOAD_DIR',
            str(Path(__file__).resolve().parents[2] / 'uploads'),
        ),
    ).resolve()

    smtp_host: str = os.getenv('SMTP_HOST', '')
    smtp_port: int = int(os.getenv('SMTP_PORT', '587'))
    smtp_user: str = os.getenv('SMTP_USER', '')
    smtp_password: str = os.getenv('SMTP_PASSWORD', '')
    smtp_from: str = os.getenv('SMTP_FROM', 'noreply@historial-go.local')
    smtp_use_tls: bool = os.getenv('SMTP_USE_TLS', 'true').strip().lower() in (
        '1',
        'true',
        'yes',
    )

    # Brevo (Sendinblue) HTTP API — SMTP timeout durumunda alternatif
    brevo_api_key: str = os.getenv('BREVO_API_KEY', '').strip()
    brevo_base_url: str = os.getenv('BREVO_BASE_URL', 'https://api.brevo.com').strip().rstrip('/')

    # OSM Overpass (POI sync)
    overpass_base_url: str = os.getenv('OVERPASS_BASE_URL', 'https://overpass.kumi.systems/api').strip().rstrip('/')
    overpass_user_agent: str = os.getenv(
        'OVERPASS_USER_AGENT',
        'HistorialGO/1.0 (contact: admin@historial-go.local)',
    ).strip()

    # Google Maps / Places (New) / Routes — backend proxy only
    google_places_api_key: str = os.getenv('GOOGLE_PLACES_API_KEY', '').strip()
    google_routes_api_key: str = os.getenv('GOOGLE_ROUTES_API_KEY', '').strip()

    @property
    def google_places_enabled(self) -> bool:
        return bool(self.google_places_api_key)

    @property
    def google_routes_enabled(self) -> bool:
        return bool(self.google_routes_api_key or self.google_places_api_key)

    @property
    def is_production(self) -> bool:
        return self.environment == 'production'

    @property
    def smtp_enabled(self) -> bool:
        return bool(self.smtp_host.strip())

    @property
    def brevo_enabled(self) -> bool:
        return bool(self.brevo_api_key)

    @property
    def expose_reset_url_in_response(self) -> bool:
        return not self.is_production and not self.smtp_enabled

    @property
    def stripe_enabled(self) -> bool:
        key = self.stripe_secret_key.strip()
        return key.startswith('sk_') or key.startswith('rk_')

    @property
    def llm_enabled(self) -> bool:
        if self.llm_provider == 'gemini':
            return bool(self.gemini_api_key.strip())
        return bool(self.openrouter_api_key.strip())


settings = Settings()
