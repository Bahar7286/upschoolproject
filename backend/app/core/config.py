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

    # LLM — OpenRouter (önerilen) veya Google Gemini
    llm_provider: str = os.getenv('LLM_PROVIDER', 'openrouter').strip().lower()
    openrouter_api_key: str = os.getenv('OPENROUTER_API_KEY', '')
    openrouter_model: str = os.getenv(
        'OPENROUTER_MODEL',
        'google/gemini-2.0-flash-001',
    )
    openrouter_base_url: str = os.getenv(
        'OPENROUTER_BASE_URL',
        'https://openrouter.ai/api/v1',
    )
    gemini_api_key: str = os.getenv('GEMINI_API_KEY', '')
    gemini_model: str = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
    llm_timeout_seconds: float = float(os.getenv('LLM_TIMEOUT_SECONDS', '45'))

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
