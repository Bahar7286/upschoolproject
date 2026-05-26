# Historial-GO — Kullanıcı Akışı (User Flow)

**Versiyon:** 2.0 | **Son güncelleme:** Mayıs 2026  
**Kapsam:** Tüm persona'lar (Turist · Rehber · İşletmeci), AI etkileşimi, gamification, personalizasyon modları.

---

## 0. Persona Haritası

| # | Persona | Yaş / Profil | Birincil hedef | Uygulama tonu |
|---|---------|-------------|----------------|---------------|
| P1 | **Meraklı Kaşif** (turist) | 25–45, teknoloji meraklısı, solo ya da çift gezgin | Kendi hızında, ilgi alanına göre rota → sesli rehber | Keşif, macera, kişisel |
| P2 | **Lisanslı Uzman** (rehber) | 30–55, deneyimli profesyonel, dijital araçlara açık | Rota oluştur → sat → geliri takip et | Güven, verimlilik, analitik |
| P3 | **Yerel İşletmeci** | 28–60, butik kafe/müze sahibi | Rota üzerinde görünürlük → turist trafiği | Basit, etkili, ROI odaklı |

---

## 1. Global Oturum Durumları

```
anon          → Token yok; landing, giriş, kayıt, keşif önizleme, harita (read-only)
auth_tourist  → JWT + role=tourist; tam keşif, satın alım, profil, gamification
auth_guide    → JWT + role=guide; tourist özellikleri + rehber paneli
auth_business → JWT + role=business (gelecek faz); iş ortağı paneli
```

**Token süresi:** `401` yanıtı geldiğinde zustand store temizlenir → `/login?expired=1`  
**Refresh stratejisi:** MVP'de token yenileme yok; kullanıcı yeniden giriş yapar.

---

## 2. P1 — Meraklı Kaşif Tam Akışı

### 2.1 Onboarding & İlk Kurulum

```
[Landing /]
    │
    ├─ "Hemen başla" CTA
    │       └─► [Kayıt /register]
    │               ├─ E-posta · şifre · ad soyad
    │               ├─ Rol seçimi (Turist / Rehber)
    │               └─► POST /auth/register → JWT
    │                       └─► [Onboarding /onboarding]
    │
    ├─ "Giriş yap"
    │       └─► [Giriş /login]
    │               └─► POST /auth/login → JWT
    │                       └─► [Keşfet /discover] (dönüş yolu)
    │
    └─ "Misafir olarak keşfet"
            └─► [Keşfet /discover] (anonim, satın alım kilitli)
```

### 2.2 Onboarding Sihirbazı (3 adım)

```
Adım 1 / İlgi alanları
  ┌────────────────────────────────────────┐
  │  Chip grid (çoklu seçim):              │
  │  [Tarih] [Sanat] [Mimari] [Gastronomi] │
  │  [Gizli Köşeler] [Modern] [Dini]       │
  │  Seçim sayısı → ilerleme çubuğu        │
  └────────────────────────────────────────┘
       ↓
Adım 2 / Pratik tercihler
  ┌────────────────────────────────────────┐
  │  Süre:  [1 sa] [2 sa] [Yarım gün] [Tam gün] │
  │  Bütçe: [Ücretsiz] [₺50-100] [₺100+]  │
  │  Dil:   [TR] [EN] [DE]                 │
  └────────────────────────────────────────┘
       ↓
Adım 3 / Tema modu (kişiselleştirme)
  ┌────────────────────────────────────────┐
  │  [🌅 Gündüz — aydınlık]               │
  │  [🌙 Gece — koyu]                     │
  │  [✨ Sistem — otomatik]               │
  │  [🏛 Miras — warm sepia (özel)]       │
  └────────────────────────────────────────┘
       ↓
  store.setOnboarding(interests, prefs, theme)
  → POST /routes/recommend (ilk kişisel öneri)
  → [Keşfet /discover] — kişisel öneri listesiyle
```

### 2.3 Keşif & AI Etkileşimi

```
[Keşfet /discover]
    │
    ├─ AI öneri paneli (onboarding tercihlerine göre)
    │       POST /routes/recommend
    │       → "İlgi alanlarına göre 5 rota"
    │       → Her kart: başlık / süre / fiyat / uyum %
    │
    ├─ Manuel filtre (ilgi, süre, fiyat aralığı)
    │       GET /routes?category=&duration=&price=
    │
    ├─ Haritada Keşfet →► [Harita /map]
    │
    └─ Rota kartına tıkla →► [Rota Detay /routes/:id]
```

**AI sadakat döngüsü:**
```
Kullanıcı rota görüntüler → beğenir/geçer → model ağırlıkları güncellenir (future)
Kullanıcı rotayı bitirir → XP kazanır → AI bir sonraki öneriyi günceller
Streak 3+ gün → AI "Gizli köşe" özel önerisi tetikler → FOMO push (future)
```

### 2.4 Rota Detay & Satın Alım

```
[Rota Detay /routes/:id]
    │
    ├─ Rota bilgileri: başlık · rehber · süre · fiyat · durak sayısı
    ├─ Durak listesi (GET /routes/:id/stops)
    │       Her durak: isim · açıklama · ► TTS önizleme
    ├─ Haritada Gör → [Harita /map?route=:id]
    │
    ├─ [Satın Al] (anonim → modal: "Giriş yap veya devam et")
    │       └─► POST /payments
    │               ├─ Başarı: konfetti animasyon + XP +50 → [Satın Alımlar /purchases]
    │               └─ Hata: formatApiError göster
    │
    └─ Zaten satın alındıysa → [Rotayı Başlat] → sesli rehber aktif
```

### 2.5 Aktif Rota & Sesli Rehber

```
[Harita /map?route=:id&active=true]
    │
    ├─ Canlı konum takibi (Geolocation API)
    ├─ Durak pinleri: ziyaret edildi ✓ / aktif 🔵 / ileride ⚪
    │
    ├─ GPS tetikleyici (20m yakınlık)
    │       → Sesli rehber otomatik başlar
    │       → Ekranda durak kartı slider'ı çıkar
    │       → XP +10 (her durak)
    │
    ├─ Manuel durak geçiş: "Bir sonraki durak →"
    │
    ├─ Rota tamamlandı modal:
    │       ✓ Başardın!
    │       XP toplamı + kazanılan rozet
    │       [Değerlendir] [Paylaş] [Keşfe Dön]
    │
    └─ Çevrimdışı modu: rota verileri cihazda cache
```

### 2.6 Gamification Akışı

```
Tetikleyici                 Ödül              Bildirim
─────────────────────────────────────────────────────
İlk kayıt                  XP +100            "Hoş geldin rozeti"
İlk rota satın alımı       XP +50             "İlk Adım" rozeti
Durak ziyareti             XP +10             sessiz
Rota tamamlama             XP +100            Konfetti + rozet modal
Streak 3 gün               XP +30             "Azimli Gezgin" rozeti
Streak 7 gün               XP +75             "Şehir Çınarı" rozeti
İlk değerlendirme          XP +20             "Eleştirmen" rozeti
5 rota tamamlama           XP +200            "Tarih Meraklısı" rozeti
Top 10 haftalık            XP +150            "Liderlik" rozeti

Seviye sistemi:
  Gezgin (0–199 XP) → Kaşif (200–499) → Tarih Dostu (500–999)
  → Şehir Üstadı (1000–2499) → Efsanevi Rehber (2500+)
```

---

## 3. P2 — Lisanslı Uzman (Rehber) Akışı

### 3.1 Rehber Kaydı

```
[Kayıt /register] → Rol: "Rehber" seç
    │
    ├─ Ek rehber alanları (gelecek faz):
    │       Lisans no · Uzmanlık · Biyografi
    │
    └─► [Rehber Paneli /guide]
            (Tourist özellikleri + rehber araçları)
```

### 3.2 Rehber Dashboard Akışı

```
[Rehber Paneli /guide]
    │
    ├─ Özet kartları:
    │       Bu ay net gelir | Toplam satış | Aktif rota sayısı
    │
    ├─ Gelir grafiği (7 gün / 30 gün)
    │       GET /guides/:id/earnings
    │
    ├─ Rota Yönetimi (gelecek faz)
    │       [+ Yeni Rota Oluştur]
    │         → Harita üzerinde durak ekle
    │         → Medya yükle (ses · fotoğraf)
    │         → Fiyat · süre · kategori
    │         → [Yayınla] → POST /routes
    │
    ├─ Ödeme Talebi
    │       POST /guides/payout (minimum ₺100)
    │       Durum: beklemede / onaylandı / ödendi
    │
    └─ Performans
            En çok satan rota · Ortalama yıldız · Tamamlama oranı
```

### 3.3 Rehber Sadakat Mekanizması

```
Düzenli içerik güncellemesi → "Aktif Rehber" rozeti → arama sıralaması ↑
5 yıldızlı değerlendirme × 10 → "Seçkin Rehber" etiketi
Aylık satış ≥ 20 → "Hızlı Yükselen" banner
Dönemsel rehber yarışmaları → özel rozet + görünürlük ödülü
```

---

## 4. P3 — Yerel İşletmeci Akışı (Faz 2)

```
[İşletmeci Kaydı] → rol=business
    │
    ├─ İşletme profili: isim · konum · kategori · açıklama
    │
    ├─ Ödül Noktası Aktivasyonu
    │       Rota üzerindeki durağa bağlantı
    │       Ziyaretçiye özel kupon/indirim tanımı
    │
    ├─ Dashboard:
    │       Rota üzerinden kaç turist gönderildi
    │       Kullanılan kupon sayısı · dönüşüm oranı
    │
    └─ Sponsorluk Paketi (aylık ücret)
            Durakta öne çıkan konum
            "Ortak Mekan" rozeti
```

---

## 5. Korumalı Rota & Yönlendirme Mantığı

| Rota | Koşul | Başarısız → |
|------|-------|------------|
| `/purchases` | JWT zorunlu | `/login?from=/purchases` |
| `/profile` | JWT zorunlu | `/login?from=/profile` |
| `/guide` | JWT + `role=guide` | Eğer turist: bilgi modal + yönlendirme |
| `/onboarding` | Yalnızca ilk giriş | Tamamlandıysa `/discover` |
| `/login`, `/register` | Zaten girişliyse | `/discover` |

**401 otomatik temizlik:**
```
API response 401 → clearSession() → navigate('/login?expired=1')
Login sayfasında "Oturumunuz sona erdi" uyarısı göster
```

---

## 6. Kişiselleştirme & AI Etkileşim Döngüsü

```
                    ┌─────────────────────────┐
                    │   Kullanıcı Profili      │
                    │   ilgi · süre · bütçe    │
                    │   dil · tema modu        │
                    └────────────┬────────────┘
                                 │ POST /routes/recommend
                    ┌────────────▼────────────┐
                    │   AI Öneri Motoru        │
                    │   Top 5 kişisel rota     │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┼────────────────────┐
             ▼                   ▼                    ▼
      [Görüntüledi]        [Satın aldı]         [Tamamladı]
      sinyal: zayıf        sinyal: güçlü        sinyal: en güçlü
             │                   │                    │
             └───────────────────┴────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Profil güncelleme       │
                    │  Sonraki öneri daha iyi  │
                    └─────────────────────────┘
```

**Kişiselleştirilmiş bildirim tetikleyiciler (MVP placeholder):**
- Yeni rota ilgi alanıyla eşleşiyor → "Senin için yeni: [başlık]"
- Kullanıcı 3 gün giriş yapmadı → "Kaçırdın: Galata'nın Gizli Köşeleri başladı"
- Streak kopmak üzere → "Bugün 1 durak ziyaret et, serinizi koruyun"
- Hava güneşli → "Bugün açık hava rotaları için mükemmel!"

---

## 7. Ekran Durumları (State Taxonomy)

Her ekranda tanımlanması gereken 6 durum:

| Durum | Görsel | Davranış |
|-------|--------|---------|
| `loading` | Skeleton cards / spinner | Etkileşim kilitli |
| `success` | Veri render | Normal |
| `empty` | İkon + açıklama + CTA | Yönlendirici |
| `error` | Hata kutusu + retry | Yeniden dene butonu |
| `offline` | Banner + cached data | Cache'den serve |
| `partial` | Kısmi veri + uyarı | Çalışmaya devam |

---

## 8. Tema & Kişiselleştirme Modları

| Mod | Tetikleyici | Görsel |
|-----|-------------|--------|
| `system` | OS tercihi | Auto light/dark |
| `light` | Manuel seçim | Heritage paper arka plan |
| `dark` | Manuel seçim | Zinc-950 + slate metin |
| `heritage` | Onboarding / Profil | Sepia · amber ağırlıklı · vintage |
| `high-contrast` | Erişilebilirlik | Siyah/beyaz / WCAG AAA |

Mod değişimi: `ThemeStore.setTheme()` → `html` dataset → Tailwind `dark:` sınıfları + `[data-theme="heritage"]` CSS override.

---

Bu doküman `docs/ux/WIREFRAMES.md` ve `docs/design-system/VISUAL_LANGUAGE.md` ile birlikte okunmalıdır.
