# Historial-GO: Proje Planı

## 1. Proje Özeti

**Historial-GO**, turizm sektöründe "Deneyim Ekonomisi" üzerine kurulu bir **B2B2C pazaryeridir.**

- **Hedef:** İstanbul'da 90 gün içinde MVP'yi doğrulamak
- **Kullanıcı Tabanı:** 10.000+ aktif kullanıcı (1. yıl hedefi)
- **Rehber Rotaları:** 200+ yayınlanmış rota (1. yıl hedefi)
- **Gelir Modeli:** %15 platform komisyonu / %85 rehber kazancı

---

## 2. Teknik Mimari

### 2.1 Teknoloji Stack

#### **Frontend (Mobile)**
- **Framework:** React Native + TypeScript
- **State Management:** Redux Toolkit / Context API
- **Maps:** React Native Maps + Google Maps SDK
- **Audio:** React Native Sound / Expo Audio (TTS entegrasyonu)
- **Offline:** SQLite / AsyncStorage
- **Build:** Expo CLI + EAS Build

#### **Backend API**
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 15
- **ORM:** Prisma
- **Authentication:** JWT + bcrypt
- **Payment:** Stripe API
- **AI Integration:** OpenRouter API (Claude 3.6)

#### **DevOps & Infrastructure**
- **Containerization:** Docker + Docker Compose
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions
- **Hosting:**
  - Frontend: Expo + EAS Build (iOS/Android)
  - Backend: Railway / Heroku
  - Database: Neon PostgreSQL (managed)

#### **Third-party Integrations**
- **Payment:** Stripe (kredi kartı, payout)
- **Maps & Geolocation:** Google Maps API
- **Text-to-Speech:** OpenRouter API (Claude with TTS)
- **Analytics:** Mixpanel / PostHog
- **Logging:** Sentry

---

## 3. Veritabanı Şeması (Temel Modeller)

```prisma
// User - Kullanıcı (Tourist/Rehber)
model User {
  id                    String    @id @default(uuid())
  email                 String    @unique
  passwordHash          String
  firstName             String
  lastName              String
  profilePicture        String?
  userType              UserType  // tourist, guide, business
  interests             String[]  // ["history", "art", "gastronomy"]
  culturePoints         Int       @default(0)
  badges                Badge[]
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relations
  purchasedRoutes       PurchasedRoute[]
  createdRoutes         Route[] @relation("GuideRoutes")
  reviews               Review[]
  payouts               Payout[]
}

// Route - Rota
model Route {
  id                    String    @id @default(uuid())
  guideId               String
  title                 String
  description           String    @db.Text
  category              String    // "history", "art", "gastronomy"
  duration              Int       // dakika cinsinden
  difficulty            String    // "easy", "medium", "hard"
  price                 Float
  rating                Float     @default(0)
  viewCount             Int       @default(0)
  purchaseCount         Int       @default(0)
  isPublished           Boolean   @default(false)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relations
  guide                 User      @relation("GuideRoutes", fields: [guideId], references: [id], onDelete: Cascade)
  stops                 Stop[]
  purchases             PurchasedRoute[]
  reviews               Review[]
}

// Stop - Durak (Rota içindeki lokasyonlar)
model Stop {
  id                    String    @id @default(uuid())
  routeId               String
  title                 String
  description           String    @db.Text
  latitude              Float
  longitude             Float
  audioUrl              String?   // TTS oluşturulmuş ses dosyası
  audioLanguages        String[]  // ["tr", "en", "de"]
  imageUrl              String?
  estimatedTime         Int       // dakika
  orderIndex            Int
  createdAt             DateTime  @default(now())
  
  // Relations
  route                 Route     @relation(fields: [routeId], references: [id], onDelete: Cascade)
}

// PurchasedRoute - Satın alınan rota
model PurchasedRoute {
  id                    String    @id @default(uuid())
  userId                String
  routeId               String
  purchasedAt           DateTime  @default(now())
  startedAt             DateTime?
  completedAt           DateTime?
  isCompleted           Boolean   @default(false)
  downloadedAt          DateTime? // Offline indirme zamanı
  
  // Relations
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  route                 Route     @relation(fields: [routeId], references: [id], onDelete: Cascade)
}

// Review - Yorum/Değerlendirme
model Review {
  id                    String    @id @default(uuid())
  userId                String
  routeId               String
  rating                Int       // 1-5
  comment               String    @db.Text
  createdAt             DateTime  @default(now())
  
  // Relations
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  route                 Route     @relation(fields: [routeId], references: [id], onDelete: Cascade)
}

// Badge - Rozet (Gamification)
model Badge {
  id                    String    @id @default(uuid())
  userId                String
  badgeType             String    // "history_lover", "city_expert", etc.
  earnedAt              DateTime  @default(now())
  
  // Relations
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Payout - Ödeme transferi
model Payout {
  id                    String    @id @default(uuid())
  guideId               String
  amount                Float
  status                PayoutStatus // pending, completed, failed
  bankAccount           String? // Şifreli olarak saklanır
  requestedAt           DateTime  @default(now())
  completedAt           DateTime?
  
  // Relations
  guide                 User      @relation(fields: [guideId], references: [id], onDelete: Cascade)
}

// Transaction - İşlem (Revenue tracking)
model Transaction {
  id                    String    @id @default(uuid())
  routeId               String
  buyerId               String
  sellerId              String
  amount                Float
  commission            Float     // Platform komisyonu (%15)
  guideEarning          Float     // Rehber kazancı (%85)
  status                TransactionStatus // pending, completed, refunded
  stripePaymentId       String?
  createdAt             DateTime  @default(now())
}

// Enum'lar
enum UserType {
  tourist
  guide
  business
}

enum PayoutStatus {
  pending
  completed
  failed
}

enum TransactionStatus {
  pending
  completed
  refunded
}
```

---

## 4. API Endpoint'leri (MVP)

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Routes (Rotalar)
```
GET    /api/routes                    # Tüm rotaları listele
GET    /api/routes?category=history   # Kategori bazında filtre
POST   /api/routes/recommend          # AI ile rota öner
GET    /api/routes/:id                # Rota detayı
POST   /api/routes/:id/purchase       # Rota satın al
GET    /api/routes/:id/stops          # Rota durakları
```

### Guide Dashboard (Rehber Paneli)
```
POST   /api/guide/routes              # Yeni rota oluştur
PUT    /api/guide/routes/:id          # Rota düzenle
DELETE /api/guide/routes/:id          # Rota sil
GET    /api/guide/analytics           # Kazanç analitiği
POST   /api/guide/payout              # Ödeme talep et
```

### User Profile
```
GET    /api/users/:id                 # Kullanıcı profili
PUT    /api/users/:id                 # Profil güncelle
GET    /api/users/:id/badges          # Rozet listesi
POST   /api/users/:id/reviews         # Yorum yaz
```

### Gamification
```
GET    /api/leaderboard               # Haftalık liderlik tablosu
GET    /api/users/:id/stats           # Kullanıcı istatistikleri
```

---

## 5. System Prompt (AI Integration)

### Route Recommendation Engine

```
Sen İstanbul'da turist rehberliği yapan bir uzman asistansın.

Kullanıcının ilgi alanlarına, ayırabileceği zamana ve bütçeye göre 
en uygun 5 rotayı türkçe olarak öner.

İLGİ ALANLARI:
- Tarih (Ottoman, Byzantine, Islamic)
- Sanat (Modern, Geleneksel)
- Gastronomi (Local, International)
- Mimari
- Doğa

ÇIKTI FORMATI:
{
  "recommendations": [
    {
      "title": "Osmanlı Mimari Turu",
      "category": "history",
      "duration": "120",
      "price": "150",
      "description": "...",
      "compatibility": "95%"
    }
  ]
}

KURALLAR:
1. Daima Türkçe kullan
2. Rota süresi kullanıcının zamanından az olmalı
3. Fiyat kullanıcı bütçesinden az olmalı
4. Aynı kategoriyi tekrar etme
5. Popüler rotaları öncele
```

### TTS (Text-to-Speech) Prompt

```
Profesyonel bir turist rehberi olarak, aşağıdaki lokasyon hakkında
3 dakikalık bir anlatım hazırla. Türkçe, İngilizce ve Almanca'da.

YER: {location_name}
BİLGİ: {historical_info}

ÇIKTI:
{
  "tr": "Seslendirilecek metin...",
  "en": "Narration text...",
  "de": "Erzähltext..."
}

TALIMATLAR:
- Turist seviyesinde açıkla
- 150-200 kelime arası
- Profesyonel ton kullan
```

---

## 6. Sprint Planı (90 Gün)

### **Sprint 1-2: Temeller (Hafta 1-2)**

#### Backlog
- [ ] Backend repo setup + Docker
- [ ] Database schema + migrations
- [ ] User authentication (signup/login)
- [ ] JWT token management
- [ ] Frontend project scaffold
- [ ] Splash screen & onboarding UI

**Deliverables:**
- ✅ Backend API çalışır (localhost:5000)
- ✅ Frontend app çalışır (expo start)
- ✅ PostgreSQL çalışır (Docker)
- ✅ User registration & login

---

### **Sprint 3-6: Core Ürün (Hafta 3-6)**

#### Backlog
- [ ] Rota CRUD operasyonları
- [ ] Google Maps entegrasyonu
- [ ] Geofence tetikleme (20m threshold)
- [ ] Stripe ödeme entegrasyonu
- [ ] Rota önerisi algoritması (AI)
- [ ] Maps UI + rota görüntüleme

**Deliverables:**
- ✅ Rehberin rota oluşturabilmesi
- ✅ Turistin rota satın alabilmesi
- ✅ Ödeme sistemi çalışır

---

### **Sprint 7-10: Zenginleştirme (Hafta 7-10)**

#### Backlog
- [ ] TTS (Text-to-Speech) üretimi
- [ ] Sesli rehberlik tetikleme
- [ ] Oyunlaştırma motoru (puan sistemi)
- [ ] Rozet sistemi
- [ ] Liderlik tablosu
- [ ] Rehber dashboard

**Deliverables:**
- ✅ Sesli rehberlik çalışır
- ✅ Puan ve rozet sistemi
- ✅ Rehber analytics paneli

---

### **Sprint 11-13: Test & Lansman (Hafta 11-13)**

#### Backlog
- [ ] Beta testing (100 kullanıcı)
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] App Store & Play Store submission
- [ ] Production deployment

**Deliverables:**
- ✅ iOS app on App Store
- ✅ Android app on Play Store
- ✅ Beta test sonuçları
- ✅ Post-launch monitoring

---

## 7. Maliyet Analizi

### Aylık Altyapı Maliyeti (MVP)

| Item | Cost | Notes |
|------|------|-------|
| PostgreSQL (Neon) | $50 | Managed database |
| Backend Hosting (Railway) | $5 | Starter tier |
| Stripe Processing | 2.9% + $0.30 | Per transaction |
| Google Maps API | ~$100 | ~100K requests/ay |
| OpenRouter API (AI) | ~$50 | Route recommendations + TTS |
| Monitoring (Sentry) | $29 | Error tracking |
| **TOTAL** | **~$235** | Per month |

### Revenue Model (Projected)

**Scenario:** 500 aylık satın alma × 100 TL avg fiyat

```
Gross Revenue:        50.000 TL
Platform Commission:   7.500 TL (15%)
Platform Costs:       -3.500 TL (infra + ops)
Net Profit:           4.000 TL/ay
```

---

## 8. Risk Yönetimi

| Risk | Olasılık | Impact | Mitigation |
|------|----------|--------|-----------|
| Stripe entegrasyonu gecikme | Orta | Yüksek | Early PoC + sandbox testing |
| Google Maps API quotası aşma | Düşük | Orta | Rate limiting + local cache |
| TTS kalitesi düşük | Orta | Orta | OpenRouter fallback, manual review |
| User acquisition yavaş | Yüksek | Yüksek | Marketing partnership, influencer |
| Database performance | Düşük | Orta | Index optimization, query caching |

---

## 9. Öğrenilen Dersler (Raccoon AI - Future Talent Video)

### ✅ Context Engineering
- **System Prompt'u doğru yaz:** Her AI call'ında context'i minimize et ama bilgi kaybetme
- **Token maliyetini hesapla:** TTS generation maliyetli → batch processing planla
- **Model fallback kurul:** Claude başarısız olursa GPT-4o'ya geç

### ✅ Prompt Engineering
- **Format belirtimi:** JSON output ister, consistency sağla
- **Tone guidelines:** Tourist-friendly, professional anlatım
- **Guardrails:** Uygunsuz içerik filtering

### ✅ API Rate Limiting & Maliyet
- **Per-user quota:** Free users 5 rota/ay, Pro 50/ay
- **Token tracking:** Her call'da input+output tokens kaydedilir
- **Cost control:** Monthly budget limits set

---

## 10. Tim Yapısı & Roller

| Rol | Sorumluluğu | Oras |
|-----|------------|------|
| **Backend Dev** | API, DB, Stripe, OpenRouter | 40 saat/hafta |
| **Mobile Dev** | React Native, Maps, Offline | 40 saat/hafta |
| **DevOps** | Docker, CI/CD, deployment | 15 saat/hafta |
| **PM** | Backlog, prioritization | 20 saat/hafta |

---

## 11. Success Criteria (MVP)

| Criterion | Target | Status |
|-----------|--------|--------|
| **Functionality** | All core features working | ⏳ |
| **Performance** | API < 1s, App load < 3s | ⏳ |
| **Reliability** | 99.5% uptime | ⏳ |
| **Security** | OWASP Top 10 pass | ⏳ |
| **Beta Users** | 100 aktif test users | ⏳ |
| **Conversion** | 30% purchase rate | ⏳ |
| **Retention** | 60% rota completion rate | ⏳ |

---

## 12. Post-MVP Roadmap

### v1.1 (3 Ay Sonra)
- [ ] AR Avatar (3D Tarihi Karakterler)
- [ ] Multi-city expansion (Ankara, İzmir)
- [ ] User subscription tiers
- [ ] Advanced analytics

### v2.0 (6 Ay Sonra)
- [ ] Global expansion (Roma, Paris)
- [ ] B2B otel partnerships
- [ ] Social features (grup turları)
- [ ] AI-generated tour descriptions

### v3.0 (12 Ay Sonra)
- [ ] VR tour previews
- [ ] Corporate events platform
- [ ] University partnerships
- [ ] Travel agency integration

---

## 13. İletişim & Coordination

- **Standup:** Günlük 15 min (10:00 AM)
- **Sprint Planning:** Pazartesi (3 saat)
- **Sprint Review:** Cuma (2 saat)
- **Repo:** GitHub (main, develop, feature branches)
- **Communication:** Slack

---

**Şu tarihte güncellendi:** 21 Nisan 2026  
**Status:** MVP Development  
**Target Go-Live:** 19 Temmuz 2026 (90 gün)
