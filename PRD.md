# HISTORIAL-GO: ÜRÜN GEREKSİNİMLERİ BELGESİ (PRD)

> **Proje anayasası** — Çözülen problem, hedef kullanıcı ve temel özellikler bu belgede tanımlıdır.  
> **Uygulama durumu (Mayıs 2026):** MVP tamamlandı — [MVP.md](MVP.md) · Canlı: [README.md](README.md#canlı-adresler)  
> Tamamlayıcı dokümanlar: [tech-stack.md](tech-stack.md) · [Plan.md](Plan.md) · [DesignSystem.md](DesignSystem.md) · [Progress.md](Progress.md)

## 1. STRATEJİK ÖZET

**Historial-GO**, turizm sektöründe "Deneyim Ekonomisi" üzerine kurulu bir **B2B2C pazaryeridir.**

- **Turistler için:** Şehri keşfetme yolculuğunu kişiselleştirilmiş, etkileşimli ve oyunlaştırılmış bir hikayeye dönüştürür.
- **Rehberler için:** Tarihi ve kültürel bilgiyi dijital rota olarak satıp ek gelir elde etmelerini sağlar.
- **İşletmeler için:** Turist trafiğini veri odaklı yönlendirerek yerel mekânlara nitelikli ziyaretçi çeker.

## 2. PROBLEM VE ÇÖZÜM ANALİZİ

### **2.1. Mevcut Sorunlar**
* **Turistler:** Klasik turları sıkıcı ve monoton buluyor. Kişisel ilgi alanlarına (sanat, gastronomi, gizli tarih) hitap eden esnek seçenekler bulmakta zorlanıyorlar.
* **Rehberler:** Gelirleri mevsimsel dalgalanmalara bağlı. Ayrıca dijital dünyada görünürlük kazanmak ve ödeme süreçlerini yönetmek için profesyonel bir araca ihtiyaç duyuyorlar.
* **Sistem:** Kaçak rehberlik sorunu hem güvenliği tehdit ediyor hem de lisanslı profesyonellerin hakkını gasp ediyor.

### **2.2. Historial-GO Çözümü**
Uygulama, yapay zeka desteğiyle turisti doğrudan ona en uygun rehberli içerikle eşleştirir. **Sesli rehberlik**, **Artırılmış Gerçeklik (AR)** ve **Oyunlaştırma** öğelerini birleştirerek keşif sürecini pasif bir izlemeden aktif bir maceraya dönüştürür.

## 3. HEDEF KİTLE VE KULLANICI KİŞİLİKLERİ (PERSONAS)

* **Persona 1: "Meraklı Kaşif" (25-45 Yaş):** Teknolojiye hakim, kalabalık gruplardan hoşlanmayan, gittiği yerin hikayesini kendi hızıyla öğrenmek isteyen modern gezgin.
* **Persona 2: "Lisanslı Uzman" (Rehber):** Yılların tecrübesine sahip, bilgisini dijital çağa taşımak ve ek gelir yaratmak isteyen profesyonel kokartlı rehber.
* **Persona 3: "Yerel İşletmeci":** Turist rotası üzerinde bulunan, dükkanına daha fazla bilinçli ziyaretçi çekmek isteyen butik kafe veya müze sahibi.

---

## 4. TEMEL ÜRÜN ÖZELLİKLERİ

### **4.1. Akıllı Rota Sihirbazı (AI Powered)**
Kullanıcının seçtiği ilgi alanları (Sanat, Tarih, Mimari vb.), ayırabileceği süre ve bütçeye göre en iyi 5 rotayı anlık olarak listeleyen kişiselleştirme motoru.

### **4.2. İnteraktif Keşif ve Sesli Rehberlik**
* **GPS / harita:** Leaflet veya Google Maps; rota durakları ve yakındaki POI’ler.
* **Geofence:** Durağa ~20 m yaklaşınca sesli anlatım tetiklenir (harita + `useGeofenceWatch`; ek duraklar dahil).
* **Sesli anlatım (keşif akışı):** İller → il → ilçe → kategori → mekan detayında TR/EN dinle (`PlaceNarrationPanel`); ayrı `/audio` sayfası yok.
* **Türkiye keşfi:** 81 il, ilçe listesi, kategori (gezme / yeme-içme / konaklama) — DB `places` + Google Places; kategori seçimi `CategoryIconCard` (beyaz ikon kart).
* **Dil:** Arayüz kısmi TR/EN (`i18n`); anlatım metni LLM önizleme + TTS (`POST /ai/narration/preview`, `/ai/narration/audio`).

### **4.3. AI Asistan ve Google entegrasyonu**
* **LLM rota önerisi:** OpenRouter veya Gemini (`POST /ai/recommend`, `GET /ai/status`).
* **Asistan sayfası:** Gezi soruları; Places ipuçları backend proxy üzerinden.
* **Google Places / Routes:** API anahtarı yalnızca sunucuda; FE `VITE_GOOGLE_MAPS_API_KEY` harita için.

### **4.4. Oyunlaştırma (Kültür Puanı Sistemi)**
Kullanıcılar gezdikçe puan kazanır, görevleri tamamladıkça rozetler (Tarih Meraklısı, Şehir Üstadı vb.) elde eder ve haftalık liderlik tablolarında diğer gezginlerle yarışır.

### **4.5. Rehber Yönetim Paneli (B2B Dashboard)**
Rehberlerin kendi rotalarını harita üzerinden oluşturabildiği, içerik (metin, fotoğraf) yükleyebildiği ve satış analitiğini takip edebildiği kapsamlı yönetim arayüzü.

---

## 5. İŞ VE GELİR MODELİ

Platformun sürdürülebilirliği çok katmanlı bir gelir yapısına dayanır:
1.  **Satış Komisyonu (%15):** Her dijital rota satışından alınan aracılık bedeli. (Rehber kazancı: %85).
2.  **Premium Üyelikler:** Reklamsız deneyim, 2 kat daha fazla puan kazanma ve rehberler için öne çıkan listeleme özellikleri.
3.  **Yerel İş Ortaklıkları:** Rota üzerindeki dükkanların "Ödül Noktası" olarak sistemde vurgulanması için alınan sponsorluk bedelleri.

---

## 6. TEKNİK ALTYAPI VE GÜVENLİK

* **Mimari:** React + Vite SPA (`frontend/`) + FastAPI REST (`backend/`); Capacitor ile mobil paket iskeleti.
* **Veritabanı:** PostgreSQL (üretim); şema **Alembic** migration ile versiyonlanır (`alembic upgrade head`).
* **Güvenli ödeme:** Stripe checkout; anahtar yoksa demo akış.
* **Üretim güvenliği:** JWT + rol; rate limit (yalnızca `ENVIRONMENT=production`); `/health`, `/ready` (DB ping).
* **Offline:** Kısmi indirme akışı (v2: tam ses + harita paketi).
* **Gizlilik:** API anahtarları ve `.env` repoda değil — [prodocs/API_KEYS_TR.md](prodocs/API_KEYS_TR.md).

---

## 7. BAŞARI METRİKLERİ (KPIs)

* **Kuzey Yıldızı Metriği:** Haftalık aktif kullanıcılar (WAU) içinden en az bir rota satın almış kullanıcı sayısı.
* **Bağlılık:** Kullanıcıların %70'inin başladığı rotayı bitirmesi.
* **Memnuniyet:** Uygulama mağazalarında 4.0 ve üzeri yıldız puanı.
* **Büyüme:** İlk yıl sonunda İstanbul özelinde 10.000 aktif kullanıcı ve 200+ yayınlanmış rota.

---

## 8. YOL HARİTASI

| Faz | Hedef | Durum |
|-----|--------|--------|
| **MVP (0–3 ay)** | Rota, AI, ödeme, rehber paneli, trip pazaryeri, 81 il keşif, Render deploy | ✅ Tamamlandı |
| **Optimizasyon (4–6 ay)** | Premium paketler, rehber analitiği derinleştirme, Places DB cache | 🔄 Kısmi (`is_premium` admin flag) |
| **Genişleme (7–12 ay)** | AR avatar, Ankara/İzmir zengin içerik, PostGIS | 📋 Planlı |
| **2. yıl+** | Avrupa şehirleri, otel B2B ortaklıkları | 📋 Vizyon |

---

## 9. TASARIM İLKELERİ
1.  **Sadelik:** Karmaşık seçenekler yerine, en uygun 3-5 öneriye odaklanmak.
2.  **Güven:** Onaylı rehber rozetleri ve şeffaf kullanıcı yorumları.
3.  **Keşif Duygusu:** Harita üzerinde "keşfedilmemiş" alanları vurgulayan sisli (fog of war) görsel efektler.

---

## 10. VERİTABANI ŞEMASI (E-R)

**Motor:** PostgreSQL (`historial_go`, Docker: `historial_go_db`) — testlerde SQLite.  
**Kaynak:** `backend/app/models/*.py` (SQLAlchemy).  
**Şema evrimi:** Alembic (`backend/alembic/versions/`); ilk kurulumda `migrate_on_start` veya `alembic upgrade head`. Seed: `bootstrap.py` (kullanıcılar, 81 il, ilçeler, demo rotalar).

### 10.1. Notlar

- `routes.guide_id`, `route_plans`, `route_notes`, `route_reviews` alanlarında **mantıksal** ilişki vardır; modelde `ForeignKey` tanımlı değildir.
- `purchases.offer_id` ve `purchases.trip_request_id` uygulama katmanında bağlanır (DB’de FK yok).
- `quote_requests` **eski** teklif akışıdır; yeni akış: `trip_requests` + `guide_offers`.
- `places` bağımsız POI kataloğudur; `trip_requests.planned_stops` JSON içinde `place_id` referansı tutulabilir.
- `cities` / `districts` Türkiye referans verisi (81 il, 973 ilçe); `favorites` kullanıcı favorileri (JWT).
- `routes.status` taslak / inceleme / yayın akışı; rehber kendi taslağını görebilir.

### 10.2. E-R diyagramı (Mermaid)

```mermaid
erDiagram
    users ||--o| guide_profiles : "1 rehber profili"
    users ||--o{ routes : "guide_id (mantıksal)"
    routes ||--|{ stops : "CASCADE"
    users ||--o{ purchases : "turist satın alır"
    routes ||--o{ purchases : "satılan rota"
    users ||--o{ route_plans : "planlar"
    routes ||--o{ route_plans : "opsiyonel rota"
    users ||--o{ route_notes : "not yazar"
    routes ||--o{ route_notes : "not konusu"
    users ||--o{ route_reviews : "değerlendirir"
    routes ||--o{ route_reviews : "değerlendirilen"
    users ||--o{ trip_requests : "turist talep"
    routes ||--o{ trip_requests : "opsiyonel rota"
    trip_requests ||--o{ guide_offers : "teklifler"
    users ||--o{ guide_offers : "rehber teklif"
    users ||--o{ quote_requests : "turist (eski)"
    users ||--o{ quote_requests : "rehber (eski)"
    routes ||--o{ quote_requests : "opsiyonel rota"
    guide_offers ||--o{ purchases : "offer_id (mantıksal)"
    trip_requests ||--o{ purchases : "trip_request_id (mantıksal)"

    users {
        int user_id PK
        string full_name
        string email UK
        string role "tourist|guide|admin"
        string password_hash
        string interests
        int duration_minutes
        float budget
        string theme_preference
        string preferred_language
        bool onboarding_completed
        int xp
        int streak_days
        string badges
        string last_active_date
        string redeemed_rewards
        string password_reset_token
        string password_reset_expires
    }

    guide_profiles {
        int profile_id PK
        int user_id FK_UK
        string verification_status
        string license_number
        string license_type
        string university
        string department
        int graduation_year
        string languages
        string regions
        string document_summary
        string bio
        string specialties
        int min_group_size
        int max_group_size
        float base_price_per_person
        string rejection_reason
        string document_path
        datetime verified_at
        datetime submitted_at
    }

    routes {
        int route_id PK
        string title
        string city
        int estimated_minutes
        float price
        string tags
        int guide_id "FK mantıksal → users"
    }

    stops {
        int stop_id PK
        int route_id FK
        string title
        text description
        float latitude
        float longitude
        int order_index
        string audio_url
    }

    places {
        int place_id PK
        string name
        string category
        string city
        string district
        float latitude
        float longitude
        text description
        string tags
        int is_partner
    }

    purchases {
        int purchase_id PK
        int user_id FK
        int route_id FK
        float amount
        string currency
        string status
        string transaction_ref
        string payment_method
        int offer_id "mantıksal → guide_offers"
        int trip_request_id "mantıksal → trip_requests"
        string stripe_session_id
    }

    route_plans {
        int plan_id PK
        int user_id "mantıksal → users"
        int route_id "opsiyonel → routes"
        string title
        string planned_date
        string planned_time
        int duration_minutes
        text memo
        string status
        datetime created_at
    }

    route_notes {
        int note_id PK
        int user_id "mantıksal → users"
        int route_id "mantıksal → routes"
        text content
        datetime updated_at
        UK user_id_route_id
    }

    route_reviews {
        int review_id PK
        int user_id "mantıksal → users"
        int route_id "mantıksal → routes"
        int rating
        text comment
        datetime created_at
        UK user_id_route_id
    }

    trip_requests {
        int request_id PK
        int tourist_id FK
        int route_id FK "nullable"
        string title
        string city
        string interests
        int group_size
        string preferred_date
        int duration_minutes
        float budget
        string preferred_language
        text message
        string route_mode
        text planned_stops "JSON place_id"
        string status
        datetime created_at
        datetime updated_at
    }

    guide_offers {
        int offer_id PK
        int request_id FK
        int guide_id FK
        text message
        float base_total
        float discount_rate
        float offered_total
        float offered_per_person
        string status
        datetime created_at
        datetime updated_at
    }

    quote_requests {
        int quote_id PK
        int tourist_id FK
        int guide_id FK
        int route_id FK "nullable"
        int group_size
        string preferred_date
        string preferred_language
        text message
        string status
        text guide_reply
        float quoted_total
        float quoted_per_person
        datetime created_at
        datetime updated_at
    }
```

### 10.3. İlişki özeti

| İlişki | Kardinalite | Açıklama |
|--------|-------------|----------|
| `users` ↔ `guide_profiles` | 1 : 0..1 | Rehber doğrulama profili (6326 / kokart) |
| `users` → `routes` | 1 : N | Rehberin yayınladığı rotalar (`guide_id`) |
| `routes` → `stops` | 1 : N | Rota durakları; rota silinince CASCADE |
| `users` + `routes` → `purchases` | N : M (ara kayıt) | Dijital rota / teklif satın alma |
| `trip_requests` → `guide_offers` | 1 : N | Yeni talep–teklif akışı |
| `quote_requests` | Turist + Rehber + ops. rota | Eski teklif akışı (deprecated) |
| `places` | — | Harita POI kataloğu; doğrudan FK yok |
| `cities` → `districts` | 1 : N | İl / ilçe referansı |
| `users` → `favorites` | 1 : N | Mekan veya rota favorisi |

---

## 11. MEVCUT UYGULAMA ÖZETİ (Mayıs 2026)

Aşağıdaki tablo, PRD’deki vizyon ile **repodaki gerçek durum** arasındaki köprüdür. Ayrıntılı epic listesi: [Plan.md](Plan.md).

| PRD alanı | Uygulama |
|-----------|----------|
| AI rota sihirbazı | ✅ `POST /ai/recommend` |
| Sesli rehber / geofence | ✅ Mekan detay TR/EN, harita geofence |
| Oyunlaştırma | ✅ XP, rozet, liderlik |
| Rehber paneli | ✅ `/guide`, doğrulama, moderasyon |
| Trip pazaryeri | ✅ `trip_requests` (eski `quote_requests` deprecated) |
| 81 il keşif | ✅ `/cities`, ilçe, kategori mekanlar |
| Google Places | ✅ `/google/*` proxy |
| AR avatar | ❌ v2 |
| Tam offline paket | ⚠️ kısmi |
| Canlı deploy | ✅ Render URL’leri README’de |