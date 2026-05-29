# MVP.md — Minimum Uygulanabilir Ürün

**Historial-GO** · B2B2C kültür turizmi pazaryeri · **Durum: MVP tamamlandı** (Mayıs 2026)

> Ürün anayasası: [PRD.md](PRD.md) · Teknik plan: [Plan.md](Plan.md) · Canlı: [README.md](README.md#canlı-adresler)

---

## 1. Özet

MVP hedefi: Turistin ilgi alanına göre rota keşfetmesi, sesli/geofence rehberlik, rehberin dijital rota satması ve trip pazaryeri — **web + API** olarak doğrulanmıştır. İlk odak İstanbul seed verisi + **81 il / 973 ilçe** keşif akışıdır.

| Ortam | URL |
|-------|-----|
| Web | https://historial-go-web.onrender.com |
| API | https://historial-go-api.onrender.com |

---

## 2. MVP kapsamı — teslim edilenler

### 2.1 Turist (B2C)

| Özellik | Uygulama |
|---------|----------|
| Onboarding (ilgi, süre, bütçe, dil) | `/onboarding`, `PATCH /auth/me` |
| AI rota önerisi | `POST /ai/recommend`, Discover + demo fallback |
| Rota detay, duraklar, satın alma | `/routes/:id`, Stripe veya demo checkout |
| Harita & geofence sesli rehber | `/map`, `/audio`, `useGeofenceWatch` |
| Türkiye keşfi | `/cities` → ilçe → kategori (gezme / yeme-içme / konaklama) |
| DB mekan + Google Places | `/places/:id`, `/google-places/:placeId`, `/google/*` proxy |
| AI asistan | `/assistant` (Places ipuçları + LLM) |
| Oyunlaştırma | XP, rozet, liderlik (`/profile`) |
| Favoriler, premium bayrağı | `/favorites`, admin `is_premium` |
| i18n | TR / EN (`frontend/src/locales/`) |

### 2.2 Rehber (B2B)

| Özellik | Uygulama |
|---------|----------|
| Doğrulama (6326 / kokart) | `/guide/dogrulama`, admin onay |
| Rota CRUD, taslak → yayın | `/guide`, moderasyon uçları |
| Trip talebi & teklif | `/talepler`, `trip_requests` + `guide_offers` |
| Kazanç / payout talebi | Guide dashboard, `/guides/me/earnings` |

### 2.3 Altyapı

| Özellik | Uygulama |
|---------|----------|
| REST API | FastAPI, Swagger `/docs` |
| Auth | JWT, şifre sıfırlama |
| LLM | OpenRouter (varsayılan) veya Gemini; `GET /ai/status` |
| Veritabanı | PostgreSQL (prod), SQLite (test); **Alembic** migration |
| Deploy | Render (`render.yaml`), `GET /health`, `GET /ready` |
| Test | Backend **141** pytest, frontend Vitest |

---

## 3. Teknik mimari (güncel)

| Katman | Teknoloji | Not |
|--------|-----------|-----|
| Arayüz | **React 19 + TypeScript + Vite** | SPA; Capacitor `android/` / `ios/` |
| Stil | Tailwind CSS 3 | [DesignSystem.md](DesignSystem.md) |
| API | **FastAPI** (Python) | Modüler: router → service → repository |
| Veri | PostgreSQL + SQLAlchemy 2 async | `alembic upgrade head` |
| Ödeme | Stripe (+ anahtarsız demo) | Checkout session |
| LLM | OpenRouter / Gemini (`httpx`) | Kural fallback: `source: rules` |
| Harita | Leaflet + opsiyonel Google Maps | `VITE_GOOGLE_MAPS_API_KEY` |
| POI proxy | Google Places & Routes | Anahtar yalnızca backend `.env` |

> **Eski taslaktan fark:** MVP dokümanındaki “React Native + Node.js” ifadesi güncellenmiştir; gerçek stack [tech-stack.md](tech-stack.md) ile uyumludur.

---

## 4. Kritik iş akışları

### Satın alma ve kullanım

1. Keşfet veya AI önerisi → rota seçimi  
2. Ödeme (Stripe veya demo) → `purchases` kaydı  
3. Harita / sesli rehber → geofence (~20 m) tetikleme  
4. XP / rozet güncellemesi  

### Türkiye keşif akışı

1. `/cities` → il seçimi  
2. İlçe listesi (`GET /cities/{id}/districts`)  
3. Kategori filtreli mekanlar (`GET /places?city=&district=&category=`)  
4. Detay: DB mekan veya Google place sayfası  

### Gelir paylaşımı (hedef model)

- Platform **%15** / rehber **%85** (PRD iş modeli; demo ödemede basitleştirilmiş akış).

---

## 5. MVP dışı / kısmi (v2)

| Özellik | Durum |
|---------|--------|
| AR avatar | Planlandı — uygulanmadı |
| Tam offline paket (ses + harita) | Kısmi (`offline-package`); tam indirme v2 |
| TTS TR/EN/DE üretimi | Anlatım metni LLM + önizleme; profesyonel TTS pipeline yok |
| App Store / Play Store yayını | Capacitor iskelet hazır; mağaza yayını zorunlu değil (web teslim) |
| Wikidata / DB Places önbelleği | Google proxy canlı; kalıcı DB cache kısmi |

---

## 6. Doğrulama (jüri / eğitmen)

```powershell
.\scripts\verify-local.ps1   # yerel
.\scripts\verify-live.ps1    # canlı
```

Demo hesap: `tourist@example.com` / `demo123` — ayrıntı: [prodocs/README.md](prodocs/README.md), [scripts/JURY_DEMO.md](scripts/JURY_DEMO.md).
