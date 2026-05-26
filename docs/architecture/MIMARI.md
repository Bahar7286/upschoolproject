# Historial-GO — Üç Katmanlı Mimari

**Karar:** Modüler **Monolith** (MVP–1. yıl)  
**Microservice değil** — ekip küçük, trafik düşük, SQLite/PostgreSQL tek DB yeterli.

## Neden Monolith?

| Kriter | Monolith | Microservice |
|--------|----------|--------------|
| MVP hızı | ✅ Tek deploy | ❌ DevOps yükü |
| Ekip (1–5 kişi) | ✅ Uygun | ❌ Aşırı |
| İşlem tutarlılığı | ✅ Tek transaction | ❌ Saga gerekir |
| Maliyet | ✅ Düşük | ❌ Yüksek |
| Ölçek (10K WAU) | ✅ Yeterli | Erken optimizasyon |

**Gelecek:** Trafik >100K WAU veya AI/ödeme ayrı ölçeklenince `payment`, `ai`, `notification` servisleri ayrılabilir. API sözleşmeleri şimdiden REST + servis sınırlarıyla hazırlanır.

---

## Katman Diyagramı

```
┌─────────────────────────────────────────────────────────┐
│  GÖRÜNÜM (Presentation) — React / Capacitor            │
│  pages · components · hooks · Zustand · TanStack Query  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP / JSON
┌──────────────────────────▼──────────────────────────────┐
│  API (FastAPI Routers) — auth, validation, HTTP codes   │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  İŞLEM (Business) — services/                           │
│  rota önerisi · plan · ödeme · gamification · harita    │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  VERİ (Data Access) — repositories/ + SQLAlchemy ORM  │
│  places · routes · stops · users · reviews              │
└──────────────────────────┬──────────────────────────────┘
                           │
                    SQLite / PostgreSQL
```

---

## Backend Modül Sınırları

| Modül | Router | Service | Repository |
|-------|--------|---------|------------|
| Kullanıcı | `user_routes` | `UserService` | `UserRepository` |
| Rota | `route_routes` | `RouteService` | `RouteRepository` |
| Durak | `stop_routes` | `StopService` | `StopRepository` + `RouteRepository` |
| Ödeme | `payment_routes` | `PaymentService` | `PurchaseRepository` + `UserRepository` |
| Plan | `plan_routes` | `PlanService` | `PlanRepository` |
| Not / Yorum | `social_routes` | `NoteService`, `ReviewService` | `NoteRepository`, `ReviewRepository` |
| Yerler (POI) | `place_routes` | `PlaceService` | `PlaceRepository` |
| Auth / Profil | `auth_routes` | `auth_service`, `profile_service` | (geçiş aşamasında) |
| Rehber | `guide_routes` | `guide_service` | (geçiş aşamasında) |
| AI | `ai_routes` | `AIService` | — |

---

## Veri Katmanı — Yer (Place) Modeli

Türkiye haritası için zengin POI kataloğu:

- `museum` — müzeler  
- `palace` — saraylar  
- `historical` — tarihi yapılar  
- `mosque` — camiler  
- `bazaar` — çarşı / sokak pazarları  
- `street` — tarihi sokak / cadde  
- `restaurant` — yemek mekanları  
- `accommodation` — konaklama  

Koordinatlar WGS84 (Google/OSM uyumlu). Harita: OpenStreetMap + opsiyonel Google Maps.

---

## Bilinen Eksikler (Yol Haritası)

1. Alembic migration (şu an `create_all` + bootstrap ALTER)  
2. Tüm servislerde repository tam geçişi  
3. Auth zorunluluğu hassas uçlarda (payments, user CRUD)  
4. PostGIS / spatial index (yüksek hacimde)  
5. OSM Overpass canlı zenginleştirme (v1.1)
