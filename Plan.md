# Plan.md — PRD’den türetilen teknik plan

**Kaynak:** [PRD.md](PRD.md) · **Durum:** MVP tamamlandı; aşağıdaki adımlar uygulama sırasıyla izlenmiştir.

---

## Epic 1 — Altyapı ve kimlik

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E1.1 | Turist olarak kayıt olup giriş yapmak istiyorum | `auth_routes`, JWT, `User` model, `profile_service`, FE login/register | ✅ |
| E1.2 | İlgi/süre/bütçe tercihlerimi kaydetmek istiyorum | Onboarding store, `PATCH /auth/me`, kullanıcı alanları | ✅ |
| E1.3 | Şifremi unuttumda sıfırlamak istiyorum | `password_reset_service`, forgot/reset uçları, FE sayfaları | ✅ |

---

## Epic 2 — Rota keşfi ve AI

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E2.1 | İlgi alanıma göre rota önerisi almak istiyorum | `POST /ai/recommend`, `AIService` + `LLMService`, Discover UI | ✅ |
| E2.2 | Rota detayında durakları görmek istiyorum | `routes`, `stops`, `RouteService`, route-detail sayfası | ✅ |
| E2.3 | Anlatım metnini önizlemek istiyorum | `POST /ai/narration/preview`, çok dilli prompt | ✅ |
| E2.4 | LLM’nin aktif olduğunu bilmek istiyorum (jüri) | `GET /ai/status`, `fetchAiStatus()` | ✅ |

---

## Epic 3 — Harita, ses, offline

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E3.1 | Haritada rotayı görmek istiyorum | Leaflet/Google map bileşenleri, `places` API | ✅ |
| E3.2 | Durağa yaklaşınca sesli anlatım istiyorum | `useGeofenceWatch`, geofence testleri, audio-guide sayfası | ✅ |
| E3.3 | Zayıf internette kullanmak istiyorum | `offline-package.ts`, indirme akışı | ✅ |

---

## Epic 4 — Ödeme ve satın alma

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E4.1 | Rotayı satın almak istiyorum | `PaymentService`, Stripe session, checkout sayfaları | ✅ |
| E4.2 | Geçmiş ödemelerimi görmek istiyorum | `purchases`, purchases sayfası | ✅ |

---

## Epic 5 — Rehber B2B ve trip pazaryeri

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E5.1 | Rehber olarak profil ve doğrulama sunmak istiyorum | `guide_profiles`, verification sayfası, admin onay | ✅ |
| E5.2 | Turist talebine teklif vermek istiyorum | `trip_requests`, `guide_offers`, marketplace UI | ✅ |
| E5.3 | Panelde analitik görmek istiyorum | Guide dashboard, stat kartları | ✅ |

---

## Epic 6 — Oyunlaştırma ve sosyal

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E6.1 | Gezdikçe XP ve rozet kazanmak istiyorum | `gamification.py`, profil XP alanları | ✅ |
| E6.2 | Rota hakkında not/yorum bırakmak istiyorum | `social_routes`, note/review servisleri | ✅ |
| E6.3 | Gezi planı oluşturmak istiyorum | `plan_routes`, planner sayfası | ✅ |

---

## Epic 7 — Kalite, teslim, deploy

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E7.1 | (Geliştirici) Regresyonu güvenle test etmek | pytest unit/integration, Vitest, coverage ≥90% servis | ✅ |
| E7.2 | (Eğitmen) Repoyu standart yapıda incelemek | `frontend/`, `backend/`, `prodocs/`, zorunlu `.md` dosyaları | ✅ |
| E7.3 | (Jüri) Canlı uygulamayı denemek | Render/Vercel deploy, README canlı URL | ⏳ Sizin deploy |

---

## Sonraki sprint (PRD yol haritası)

1. Alembic migration (şema versiyonlama)
2. PostGIS / spatial index
3. AR avatar entegrasyonu (v2)
4. Ankara / İzmir şehir paketleri

---

## Bağımlılık sırası (özet)

```
Docker PG → Backend modeller → Auth → Routes/Places → AI (LLM) → FE sayfalar
         → Payments → Trip/Guide → Tests → Deploy şablonları → Canlı URL
```
