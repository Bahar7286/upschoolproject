# Test yapısı (modüler)

Backend katmanları `app/` ile hizalıdır.

| Uygulama modülü | Unit test |
|-----------------|-----------|
| `app/utils/geolocation.py` | `unit/test_geolocation.py` |
| `app/core/security.py` | `unit/test_security.py` |
| `app/core/pricing.py` | `unit/test_pricing.py` |
| `app/services/password_reset_service.py` | `unit/test_password_reset_service.py` |
| `app/services/payment_service.py` | `unit/test_payment_service.py` |
| `app/services/ai_service.py` | `unit/test_ai_service.py` |
| `app/services/trip_request_service.py` | `unit/test_trip_request_service.py`, `test_trip_request_parsing.py` |
| `app/services/profile_service.py` | `unit/test_profile_service.py` |
| `app/services/guide_profile_service.py` | `unit/test_guide_profile_service.py` |
| `app/services/user_service.py` | `unit/test_user_service.py` |
| `app/services/guide_service.py` | `unit/test_guide_service.py` |
| `app/services/route_service.py` | `unit/test_route_service.py` |
| `app/services/stop_service.py` | `unit/test_stop_service.py` |
| `app/services/place_service.py` | `unit/test_place_service.py` |
| `app/services/plan_service.py` | `unit/test_plan_service.py` |
| `app/services/review_service.py` | `unit/test_review_service.py` |
| `app/services/note_service.py` | `unit/test_note_service.py` |
| `app/services/tts_service.py` | `unit/test_tts_service.py` |
| HTTP router’lar (uçtan uca) | `integration/test_auth_payment_ai.py`, `test_api.py` |

## Veritabanı

- **Entegrasyon:** `test_historial_go.db` (`tests/conftest.py`)
- **Unit:** `test_unit.db` (`tests/unit/conftest.py`) — dosya çakışması yok

## Komutlar

```powershell
cd backend
$env:DATABASE_URL="sqlite+aiosqlite:///./test_hg.db"

uv run pytest tests/unit -m unit -q
uv run pytest tests/integration tests/test_api.py -m integration -q
uv run pytest -q
uv run pytest --cov=app/services --cov-fail-under=90 -q
```
