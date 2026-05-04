import os


class Settings:
    """Uygulama ve JWT ayarları. Üretimde `JWT_SECRET_KEY` mutlaka ayarlanmalıdır."""

    jwt_secret_key: str = os.getenv('JWT_SECRET_KEY', 'dev-only-change-me-in-production')
    jwt_algorithm: str = 'HS256'
    access_token_expire_minutes: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440'))


settings = Settings()
