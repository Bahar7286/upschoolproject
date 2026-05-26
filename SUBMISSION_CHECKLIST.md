# Proje teslim kontrol listesi (Historial-GO)

## Zorunlu dokümanlar

- [x] [PRD.md](PRD.md) — problem, hedef kullanıcı, temel özellikler
- [x] [tech-stack.md](tech-stack.md) — teknolojiler, gerekçeler, AI kullanımı
- [x] [Plan.md](Plan.md) — kullanıcı hikayeleri → teknik adımlar
- [x] [DesignSystem.md](DesignSystem.md) — renk, tipografi, bileşenler
- [x] [Progress.md](Progress.md) — iş / karar / hata kaydı
- [x] Gizli anahtarlar repoda yok (yalnızca `.env.example`)
- [x] API güvenliği: kullanıcı/rota/ödeme uçları JWT + rol; duraklar satın alma kilidi

## Kabul kriterleri

### 1. Etkileşimli uygulama (statik site değil)

- [x] Kullanıcı kaydı / girişi (JWT)
- [x] Onboarding (ilgi, süre, bütçe)
- [x] Rota keşfi, harita, geofence sesli rehber
- [x] Ödeme / satın alma akışı
- [x] Rehber paneli, gezi talebi & teklif
- [x] Oyunlaştırma (XP, rozet, liderlik)

**Problem:** Turist için kişiselleştirilmiş kültür rotası ve sesli rehber; rehber için dijital gelir.

### 2. Yapay zeka (LLM) — API entegrasyonu

- [x] `app/services/llm_service.py` — OpenRouter & Gemini HTTP API
- [x] `POST /ai/recommend` — LLM ile rota sıralama (`source: llm`)
- [x] `POST /ai/narration/preview` — LLM ile çok dilli anlatım metni
- [x] `GET /ai/status` — yapılandırma doğrulama
- [x] Anahtar yoksa kural tabanlı fallback (geliştirme modu)

### 3. Frontend / Backend ayrımı

- [x] `backend/` — FastAPI REST (`/auth`, `/routes`, `/ai`, …)
- [x] `frontend/` — React SPA, `VITE_API_BASE_URL` ile API
- [x] Capacitor ile mobil paket aynı API’ye bağlanabilir

### 4. Canlı deploy

- [ ] **Sizin doldurmanız gereken:** Render Blueprint deploy + `scripts/update-live-urls.ps1` ile README/DEPLOYMENT URL
- [x] `render.yaml` + `backend/Dockerfile` + `frontend/vercel.json` hazır
- [x] Adım adım: [`scripts/RENDER_BLUEPRINT.md`](scripts/RENDER_BLUEPRINT.md)

## Hızlı demo (jüri)

1. Canlı site → Kayıt / `tourist@example.com` / `demo123`
2. Keşfet → **Kişisel önerileri getir** (LLM aktif etiketi görünmeli)
3. Rota detay → Ses / offline indir
4. `https://<api>/ai/status` → `llm_enabled: true`
5. `https://<api>/docs` → Swagger
