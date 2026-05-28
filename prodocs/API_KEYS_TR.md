# Historial-GO — Dış servisler ve API anahtarları

Bu belge, yapay zeka asistanı, canlı harita pinleri ve rota çizimi için **nereden anahtar alacağınızı**, **nereye yapıştıracağınızı** ve **Render’da ne ayarlayacağınızı** özetler.

---

## Özet tablo

| Servis | Ne işe yarar? | Nereye yazılır? | Zorunlu mu? |
|--------|----------------|-----------------|-------------|
| **OpenRouter** (örn. Gemma) | Asistan sohbeti, rota önerisi, sesli anlatım metni | `backend/.env` → `OPENROUTER_API_KEY` | Asistan için **evet** |
| **Google Places API (New)** | “Canlı mekan” pinleri (haritada kırmızı pinler) | `backend/.env` → `GOOGLE_PLACES_API_KEY` | Harita pinleri için **evet** |
| **Google Routes API** | “Konumumdan rotayı çiz”, yürüyüş/araç süresi | `backend/.env` → `GOOGLE_ROUTES_API_KEY` (yoksa Places key kullanılır) | Rota çizimi için **evet** |
| **Maps JavaScript API** | Tarayıcıda Google harita kutusu | `frontend/.env` → `VITE_GOOGLE_MAPS_API_KEY` | Google harita UI için **evet** |
| **PostgreSQL** | İller, ilçeler, DB mekanları, kullanıcılar | `backend/.env` → `DATABASE_URL` | **evet** |
| **JWT** | Oturum | `backend/.env` → `JWT_SECRET_KEY` | **evet** |
| **Stripe** | Ödeme | `backend/.env` | Opsiyonel (demo mod var) |

**Canlı sitede “Sunucuya bağlanılamadı”** → Genelde `VITE_API_BASE_URL` (frontend) yanlış veya API servisi ayakta değil. Render’da `historial-go-web` ortam değişkeninde API URL’si `https://historial-go-api.onrender.com` (kendi API adresiniz) olmalı.

---

## 1. Yapay zeka (Asistan, onboarding rotaları, anlatım)

### OpenRouter (önerilen)

1. [https://openrouter.ai/keys](https://openrouter.ai/keys) → hesap aç → **Create Key**
2. Kopyala: `sk-or-v1-...`

**Yerel geliştirme** — `backend/.env`:

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-BURAYA
OPENROUTER_MODEL=google/gemma-4-31b-it:free
```

Model adı OpenRouter panelindeki tam slug olmalıdır (ör. `google/gemma-4-31b-it:free`). **Gemini değil, Gemma** kullanıyorsanız `OPENROUTER_MODEL` buna göre ayarlanır.

**Render** — `historial-go-api` → Environment:

- `LLM_PROVIDER` = `openrouter`
- `OPENROUTER_API_KEY` = (secret)
- `OPENROUTER_MODEL` = `google/gemma-4-31b-it:free` (isteğe bağlı; Blueprint varsayılanı)

Asistan çalışmıyorsa: anahtar boş, kota bitmiş veya API loglarında 401/429 kontrol edin. Backend `/health` ve asistan isteği 503 dönüyorsa LLM kapalıdır.

### Alternatif: Google Gemini API (doğrudan, OpenRouter değil)

OpenRouter yerine Google Cloud üzerinden Gemini kullanmak isterseniz:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
```

---

## 2. Google Harita ve mekanlar

Google Cloud Console: [https://console.cloud.google.com/](https://console.cloud.google.com/)

1. Proje oluştur → **Billing** (faturalandırma) aç
2. Şu API’leri **etkinleştir**:
   - Maps JavaScript API
   - Places API (New)
   - Routes API
3. **Credentials** → API Keys oluştur

### Backend (sunucu) — Places + Routes

`backend/.env`:

```env
GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_ROUTES_API_KEY=AIza...   # opsiyonel; boşsa Places key kullanılır
```

**Render** → `historial-go-api` aynı değişkenler.

Kısıtlama: Bu anahtarlar **IP veya sunucu** kısıtlı olabilir; Render için “None” veya Google’ın önerdiği kısıt. **Referrer kısıtı backend key’de çalışmaz.**

### Frontend (tarayıcı) — harita kutusu

`frontend/.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

**Render** → `historial-go-web`:

```env
VITE_GOOGLE_MAPS_API_KEY=...
VITE_API_BASE_URL=https://SIZIN-API.onrender.com
```

Frontend key’de **Application restrictions → HTTP referrers**: `http://localhost:5173/*`, canlı domain `https://historial-go-web.onrender.com/*` vb.

### “Neden sadece 20 canlı mekan?”

Google **Places Nearby Search (New)** her istekte en fazla **20 sonuç** döndürür; bu Adıyaman’da gerçekten 20 mekan olduğu anlamına gelmez — **API üst sınırıdır**. Uygulama ayrıca veritabanındaki mekanları (ilçe sayfalarında kartlar, `limit: 200`) gösterir. Backend, kategori seçilmediğinde birden fazla tip araması birleştirerek daha fazla pin üretmeye çalışır (yine de Google tarafı sınırlıdır).

---

## 3. Veritabanı ve CORS

**Yerel** `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://historial:historial_dev_password@localhost:5432/historial_go
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:5173
```

**Render API**:

- `DATABASE_URL` = Render Postgres Internal URL
- `CORS_ORIGINS` = `https://historial-go-web.onrender.com` (frontend URL’niz)
- `JWT_SECRET_KEY` = güçlü rastgele string (32+ karakter)

---

## 4. İl / ilçe / mekan görselleri (veritabanı)

`cities.image_url`, `districts.image_url`, `places.image_url` alanları **Wikipedia küçük resim** URL’leri ile doldurulur (ek API anahtarı gerekmez).

### Yerel senkron (önerilen)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m app.db.migrate_on_start
python -m app.scripts.sync_images --scope all --limit 200
```

Sadece iller: `python -m app.scripts.sync_images --scope cities`  
Sadece bir ilin ilçeleri: `python -m app.scripts.sync_images --scope districts --city-id 34`  
Mekanlar: `python -m app.scripts.sync_images --scope places --limit 500`  
Yeniden yaz (mevcut URL üzerine): `--force`

### Admin API (giriş: admin JWT)

`POST /admin/images/sync?scope=all&places_limit=200&force=false`

`scope`: `all` | `cities` | `districts` | `places`

Frontend, DB’de URL varsa onu kullanır; yoksa placeholder’a düşer.

---

## 5. Hızlı kontrol listesi

| Belirti | Muhtemel neden |
|---------|----------------|
| Onboarding / asistan: “Sunucuya bağlanılamadı” | `VITE_API_BASE_URL` yanlış, API down, CORS |
| Asistan cevap vermiyor | `OPENROUTER_API_KEY` yok |
| Harita gri / OSM | `VITE_GOOGLE_MAPS_API_KEY` yok |
| Pin yok / amber uyarı | `GOOGLE_PLACES_API_KEY` yok veya API kapalı |
| Rota çizilmiyor | `GOOGLE_ROUTES_API_KEY` veya Places key + Routes API etkin |
| En fazla ~20 Google pini | Google Nearby Search limiti (normal) |

Yerel test:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```powershell
cd frontend
npm run dev
```

`frontend/.env`: `VITE_API_BASE_URL=http://127.0.0.1:8000`
