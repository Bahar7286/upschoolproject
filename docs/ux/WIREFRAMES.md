# Historial-GO — Wireframe Detay Referansı

**Versiyon:** 2.0 | **Ölçek:** Mobil öncelik (375px) · Tablet (768px) · Masaüstü (1280px)  
**Tipografi:** Sora (başlık) · DM Sans (gövde) | **İkon:** Lucide outlined | **Grid:** 8px base

---

## Notasyon Kılavuzu

```
[BTN]      → Buton (primary / secondary / ghost)
[ICO]      → Lucide ikon
{DURUM}    → Ekran durumu notu
≡          → Ayırıcı / bölüm
●          → Dolu / aktif
○          → Boş / pasif
░░░        → Skeleton loader
```

---

## EKRAN 00 — Splash / Başlangıç

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         ◇ Historial-GO          │  ← logo mark + wordmark, ortalı
│      İstanbul'u hisset          │  ← tagline, font-display
│                                 │
│         ████████ %XX            │  ← yükleme çubuğu (amber)
│                                 │
│                                 │
└─────────────────────────────────┘
```

**Durum:** Sadece `loading`. Capacitor SplashScreen kapandıktan sonra JS bundle yüklenir.  
**Geçiş:** Token yoksa → `/`; token varsa → `/discover`

---

## EKRAN 01 — Landing `/`

```
┌─────────────────────────────────────────┐  HEADER (sticky, blur)
│ ◇ Historial-GO            [☾] [Giriş]  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐  HERO (koyu gradient üzerine)
│                                         │
│  ✦ İstanbul · AI Kişiselleştirme        │  ← eyebrow, amber
│                                         │
│  Şehri kendi                            │
│  hikayenle keşfet                       │  ← h1, font-display, 3xl–4xl
│                                         │
│  AI destekli sesli rehber, kişisel      │
│  rota önerileri ve oyunlaştırma.        │  ← alt başlık, text-base
│                                         │
│  [BTN primary: Hemen başla →]           │
│  [BTN secondary: Rotalara göz at]       │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐            │  ← güven satırı
│  │ 200+ │ │  4.8 │ │  3   │            │
│  │ rota │ │ yıldz│ │ şehir│            │
│  └──────┘ └──────┘ └──────┘            │
└─────────────────────────────────────────┘

≡  ÖZELLIK KARTLARI (3 kart grid)  ≡

┌───────────┐ ┌───────────┐ ┌───────────┐
│ [ICO map] │ │ [ICO mic] │ │[ICO award]│
│  Akıllı   │ │   Sesli   │ │   Puan &  │
│  Harita   │ │  Rehber   │ │  Rozetler │
│ Gerçek    │ │Otomatik   │ │Gezdikçe   │
│ zamanlı   │ │tetikleme  │ │kazan      │
└───────────┘ └───────────┘ └───────────┘

≡  NASIL ÇALIŞIR (numbered steps)  ≡

① Kayıt ol → ilgi alanlarını seç
② AI rotanı önerir
③ Hareket et, sesli rehber devreye girer
④ XP kazan, rozet topla

≡  FOOTER  ≡
Hakkında · Rehber Ol · Gizlilik · İletişim
```

**Durumlar:** `anon_light` / `anon_dark` / `anon_heritage`  
**CTAlar:** "Hemen başla" → `/register` | "Rotalara göz at" → `/discover`

---

## EKRAN 02 — Kayıt `/register`

```
┌─────────────────────────────────┐  HEADER
│ ◇ Historial-GO          [☾]   │
└─────────────────────────────────┘

┌─────────────────────────────────┐  KART (rounded-[22px], shadow-lift)
│ [ICO user-plus]                 │
│ Yeni hesap                      │  ← eyebrow, primary renk
│ Kayıt ol                        │  ← h1
│ İstanbul rotalarını keşfetmeye  │
│ bir adım kaldı.                 │
│                                 │
│ Ad soyad                        │
│ ┌─────────────────────────────┐ │
│ │ Adınız Soyadınız            │ │  ← min-h-[48px]
│ └─────────────────────────────┘ │
│                                 │
│ E-posta                         │
│ ┌─────────────────────────────┐ │
│ │ ornek@email.com             │ │
│ └─────────────────────────────┘ │
│                                 │
│ Şifre (en az 6 karakter)        │
│ ┌─────────────────────────────┐ │
│ │ ••••••••              [ICO] │ │  ← show/hide toggle
│ └─────────────────────────────┘ │
│                                 │
│ Hesap türü                      │
│ ┌──────────────┐ ┌─────────────┐│
│ │🗺️ Turist     │ │🧭 Rehber   ││  ← radio kart, seçiliyse border-primary
│ │Rota keşfet   │ │Rota oluştur││
│ └──────────────┘ └─────────────┘│
│                                 │
│ [● hata mesajı role="alert"]    │  {error}
│                                 │
│ [BTN primary full: Hesap oluştur]│
│                                 │
│ Zaten hesabın var mı? [Giriş yap]│
│ [← Ana sayfa]                   │
└─────────────────────────────────┘

Kayıt olarak Kullanım Koşulları'nı kabul edersiniz.
```

**Durumlar:**  
- `idle` → form aktif  
- `loading` → buton disabled, spinner  
- `error` → kırmızı kutu + `role="alert"`  
- `success` → JWT set → `/onboarding`

---

## EKRAN 03 — Giriş `/login`

```
┌─────────────────────────────────┐
│ ◇ Historial-GO          [☾]   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ [ICO log-in]                    │
│ Güvenli oturum                  │  ← eyebrow
│ Giriş yap                       │  ← h1
│ AI rotaları ve sesli rehber      │
│ için hesabınla devam et.        │
│                                 │
│ {eğer ?from= var} ────────────  │
│ ┌ ⚠ Devam etmek için giriş   ┐ │  ← amber bilgi kutusu
│ └ yapın, yönlendirilirsiniz   ┘ │
│                                 │
│ Demo: tourist@example.com / demo123│  ← bilgi kutusu (küçük)
│                                 │
│ E-posta                         │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ Şifre                           │
│ ┌─────────────────────────────┐ │
│ │                       [ICO] │ │
│ └─────────────────────────────┘ │
│                                 │
│ [● hata mesajı]                 │  {error}
│                                 │
│ [BTN primary full: Devam et]    │
│                                 │
│ Hesabın yok mu? [Kayıt ol]      │
│ [← Ana sayfa]                   │
└─────────────────────────────────┘
```

**Geçiş:** Başarılı → `?from` varsa oraya, yoksa `/discover`

---

## EKRAN 04 — Onboarding `/onboarding` (3 adım)

### Adım 1 — İlgi Alanları

```
┌─────────────────────────────────┐
│ ← geri        1/3               │  ← ilerleme çubuğu
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░  │  (amber, animated)
│                                 │
│ Seni en çok ne ilgilendiriyor?  │  ← h2
│ En az 2 seç                     │  ← yardımcı metin
│                                 │
│ ┌─────────┐ ┌─────────┐        │
│ │🏛 Tarih │ │🎨 Sanat │        │  ← chip/pill butonlar
│ └─────────┘ └─────────┘        │  Seçiliyse: bg-primary text-white
│ ┌─────────┐ ┌─────────┐        │
│ │🏗 Mimari│ │🍽 Gastro│        │
│ └─────────┘ └─────────┘        │
│ ┌─────────┐ ┌─────────┐        │
│ │🔍 Gizli │ │🕌 Dini  │        │
│ └─────────┘ └─────────┘        │
│ ┌─────────┐                    │
│ │⚡Modern │                    │
│ └─────────┘                    │
│                                 │
│ Seçilen: {N}                    │
│                                 │
│ [BTN primary: Devam →]          │  disabled if N < 2
└─────────────────────────────────┘
```

### Adım 2 — Pratik Tercihler

```
│ ← geri        2/3               │
│ ██████████████░░░░░░░░░░░░░░░  │
│                                 │
│ Nasıl gezmek istersin?          │
│                                 │
│ Süre                            │
│ [1 sa][2 sa][Yarım gün][Tam gün]│  ← segment control
│                                 │
│ Bütçe                           │
│ [Ücretsiz][₺50–100][₺100+]     │
│                                 │
│ Tercih dili                     │
│ [🇹🇷 TR][🇬🇧 EN][🇩🇪 DE]       │
│                                 │
│ [BTN primary: Devam →]          │
```

### Adım 3 — Tema Seçimi

```
│ ← geri        3/3               │
│ ████████████████████████████░  │
│                                 │
│ Görünümünü seç                  │
│ İstediğinde değiştirebilirsin   │
│                                 │
│ ┌──────────────────────────────┐│
│ │ 🌅 Gündüz                   ││  ← büyük seçim kartı
│ │ Açık, ferah, doğal           ││  Seçiliyse: border-2 border-primary
│ └──────────────────────────────┘│
│ ┌──────────────────────────────┐│
│ │ 🌙 Gece                     ││
│ │ Koyu, gözleri korur          ││
│ └──────────────────────────────┘│
│ ┌──────────────────────────────┐│
│ │ ✨ Sistem                   ││
│ │ Cihaz tercihine uyar         ││
│ └──────────────────────────────┘│
│ ┌──────────────────────────────┐│
│ │ 🏛 Miras (özel)             ││
│ │ Sıcak sepia · vintage doku   ││
│ └──────────────────────────────┘│
│                                 │
│ [BTN primary: Keşfe Başla! →]   │
└─────────────────────────────────┘
```

---

## EKRAN 05 — Keşfet `/discover`

```
┌─────────────────────────────────┐  HEADER (AppLayout üst)
│ ◇ Historial-GO    [+] [☾][çıkış]│
└─────────────────────────────────┘

Merhaba, {ad}! 👋                   ← kişiselleştirilmiş karşılama
İstanbul seni bekliyor              ← subtitle

┌─────────────────────────────────┐  AI ÖNERİ PANELİ
│ [ICO sparkles] AI Önerin        │
│ Tarih · Mimari · 2 sa · ₺100   │  ← onboarding tercihleri özet
│ [BTN: Rotaları öner →]          │  → POST /routes/recommend
└─────────────────────────────────┘

≡  FİLTRE ÇUBUĞU  ≡
[Tümü][Tarih][Sanat][Mimari][Gastro][Gizli]  ← yatay scroll chips

≡  ROTA KARTLARI (2 sütun grid mobil, 3 masaüstü)  ≡

{loading}
┌──────────┐ ┌──────────┐
│ ░░░░░░░░ │ │ ░░░░░░░░ │  ← skeleton (rounded-[22px])
│ ░░░░░░   │ │ ░░░░░░   │
│ ░░░░     │ │ ░░░░     │
└──────────┘ └──────────┘

{success}
┌──────────────────┐ ┌──────────────────┐
│ [IMG · gradient] │ │ [IMG · gradient] │
│ ●●○○○ Tarih      │ │ ●●●○○ Sanat      │  ← kategori rozeti
│ Galata'nın       │ │ Pera'nın Gizli   │
│ Sırları          │ │ Sanatçıları      │
│ [ICO clock] 2sa  │ │ [ICO clock] 1.5sa│
│ [ICO map] 5 dur. │ │ [ICO map] 4 dur. │
│ ₺120             │ │ ₺80              │
│ [BTN: Detay →]   │ │ [BTN: Detay →]   │
└──────────────────┘ └──────────────────┘

{empty}
[ICO compass, büyük]
Henüz rota yok
Tercihlerini değiştir ya da tüm rotaları gör
[BTN ghost: Filtreyi temizle]

{error}
[ICO wifi-off]
Rotalar yüklenemedi
[BTN ghost: Tekrar dene]

≡  ALT NAV (mobil)  ≡
┌──────┬──────┬──────┬──────┐
│[ICO] │[ICO] │[ICO] │[ICO] │
│Keşfet│Harita│Satın │Profil│
└──────┴──────┴──────┴──────┘
```

---

## EKRAN 06 — Harita `/map`

```
┌─────────────────────────────────┐  HEADER
│ [← geri]  Harita        [ICO]  │
└─────────────────────────────────┘

┌─────────────────────────────────┐  HARİTA (tam genişlik)
│                                 │
│    [LEAFLET / GOOGLE MAP]       │
│                                 │
│  📍 Mavi pin: kullanıcı konumu  │
│  🟡 Altın pin: rota durağı      │
│  ✅ Yeşil pin: ziyaret edildi   │
│                        [+][-]   │  ← zoom
│                        [⊙]     │  ← konumuma git
└─────────────────────────────────┘

{aktif rota yoksa}
┌─────────────────────────────────┐  BOTTOM SHEET (collapsed, swipe yukarı)
│ ▬  Aktif rota yok               │
│ Keşfet'ten bir rota başlat      │
│ [BTN: Rotalara göz at]          │
└─────────────────────────────────┘

{aktif rota varsa}
┌─────────────────────────────────┐  BOTTOM SHEET (açık)
│ ▬  Galata'nın Sırları  [× kapat]│
│ ████████░░ 3/5 durak           │  ← ilerleme
│                                 │
│ ▼ Aktif Durak                  │
│ ① Galata Kulesi                 │
│   Osmanlı döneminin simgesi...  │
│   [ICO play] Sesli rehber       │  ← TTS butonu
│                                 │
│ ○ Sıradaki: Galata Köprüsü     │
│                                 │
│ [BTN: Bir sonraki durak →]      │
└─────────────────────────────────┘
```

---

## EKRAN 07 — Rota Detay `/routes/:id`

```
┌─────────────────────────────────┐  HEADER
│ [← Keşfet]    Rota Detayı      │
└─────────────────────────────────┘

[IMG hero — tam genişlik, 200px yükseklik, gradient overlay]

┌─────────────────────────────────┐
│ Tarih     ● Aktif               │  ← kategori rozeti + durum
│ Galata'nın Sırları              │  ← h1
│ Rehber: Ahmet Y. · [ICO star]4.8│
│                                 │
│ [ICO clock] 2 saat              │
│ [ICO map-pin] 5 durak           │
│ [ICO globe] TR · EN             │
│                                 │
│ ₺120                            │  ← fiyat, büyük
│                                 │
│ [BTN primary full: Satın Al]    │  ← satın alınmışsa: "Rotayı Başlat"
│ [BTN ghost: Haritada Gör]       │
└─────────────────────────────────┘

≡  AÇIKLAMA  ≡
Galata semtinin 600 yıllık hikayesi...

≡  DURAKLAR  ≡

┌─────────────────────────────────┐
│ ① [ICO map-pin amber]           │
│ Galata Kulesi                   │  ← durak başlığı
│ 41.0256° N, 28.9741° E          │  ← koordinat
│ 14. yüzyılda inşa edilen bu kule│
│ [BTN ghost: 🔊 Önizleme dinle]  │  ← TTS önizleme
└─────────────────────────────────┘
  ↕ (dikey çizgi bağlantı)
┌─────────────────────────────────┐
│ ② Galata Köprüsü                │
│ ...                             │
└─────────────────────────────────┘

{satın alınmamışsa son duraklar blur + kilit overlay}
┌─────────────────────────────────┐
│ 🔒 ④ ve ⑤. duraklar             │
│ Satın alarak tam rotayı görün   │
│ [BTN: Satın Al]                 │
└─────────────────────────────────┘

≡  DEĞERLENDİRMELER  ≡
[ICO star filled]×4  [ICO star half]×1
"Harika bir deneyimdi..." — Kullanıcı A
"Rehber bilgileri çok zengin" — Kullanıcı B
```

---

## EKRAN 08 — Satın Alımlar `/purchases`

```
[Korumalı rota → JWT yoksa /login]

┌─────────────────────────────────┐
│ [← geri]  Satın Alımlarım      │
└─────────────────────────────────┘

{loading} → skeleton listesi

{empty}
[ICO shopping-bag, büyük, muted]
Henüz satın alımın yok
Rotaları keşfetmeye başla
[BTN primary: Keşfet →]

{success}
┌─────────────────────────────────┐
│ Galata'nın Sırları              │
│ [ICO calendar] 3 Mayıs 2026    │
│ ₺120 · Tamamlandı ✅           │
│ [BTN ghost: Tekrar Başlat]     │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Pera'nın Sanatçıları            │
│ [ICO calendar] 1 Mayıs 2026    │
│ ₺80 · Devam Ediyor →           │
│ [BTN primary: Devam Et]        │
└─────────────────────────────────┘
```

---

## EKRAN 09 — Profil `/profile`

```
[Korumalı]

┌─────────────────────────────────┐
│ [← geri]  Profil         [ICO] │
└─────────────────────────────────┘

┌─────────────────────────────────┐  KULLANICI KART
│         [Avatar 64px]           │
│         Gülbahar K.             │
│         tourist@example.com     │
│         [Turist rozeti]         │
└─────────────────────────────────┘

≡  GAMİFİCATION PANEL  ≡

┌──────────┐ ┌──────────┐ ┌──────────┐
│ [ICO zap]│ │[ICO flame]│ │[ICO users]│
│  1.250   │ │  5 günlük │ │  #12     │
│  XP      │ │  Streak   │ │  Haftalık│
└──────────┘ └──────────┘ └──────────┘

Seviye ilerleme çubuğu:
Tarih Dostu ████████████░░░░░░ Şehir Üstadı
1.250 / 2.500 XP

≡  KAZANILAN ROZETLER  ≡

[🥇 İlk Adım][🧭 Azimli Gezgin][🏛 Tarih Meraklısı]
[? ? ? kilitli ×5]  ← kilitli rozet gri, üstüne tıklayınca "nasıl kazanırsın" tooltip

≡  HAFTALIK LİDERLİK  ≡
┌─────────────────────────────────┐
│ #1  Ali K.        2.100 XP  🥇  │
│ #2  Zeynep M.     1.850 XP  🥈  │
│ #12 Sen           1.250 XP  ←   │  ← kullanıcı vurgulanmış
│ ...                             │
└─────────────────────────────────┘

≡  AYARLAR  ≡
[ICO sun/moon] Tema: Miras modu
[ICO globe] Dil: Türkçe
[ICO bell] Bildirimler: Açık
[ICO shield] Gizlilik
[ICO log-out] Çıkış yap
```

---

## EKRAN 10 — Rehber Paneli `/guide`

```
[Korumalı: role=guide; turist ise bilgi modal]

┌─────────────────────────────────┐
│ [← geri]  Rehber Paneli        │
└─────────────────────────────────┘

≡  ÖZET (3 kart)  ≡
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Bu Ay    │ │ Toplam   │ │ Aktif    │
│ ₺3.400   │ │ 47 Satış │ │ 3 Rota   │
└──────────┘ └──────────┘ └──────────┘

≡  GELİR GRAFİĞİ  ≡
[Çubuk/çizgi grafik — 7 gün]
[BTN ghost: 30 gün]  [BTN ghost: Tümü]

≡  EN ÇOK SATAN ROTA  ≡
① Galata'nın Sırları   ₺2.100  (21 satış)
② Pera'nın Sanatçıları ₺800   (10 satış)

≡  ÖDEME TALEBİ  ≡
Bekleyen bakiye: ₺3.400
[BTN primary: Ödeme Talep Et]
Min. ₺100 · 3–5 iş günü

≡  ROTA YÖNETİMİ (gelecek faz)  ≡
[BTN: + Yeni Rota Oluştur]
```

---

## EKRAN 11 — Sesli Rehber `/audio-guide` (aktif rota)

```
┌─────────────────────────────────┐  HEADER
│ [× kapat]  Sesli Rehber         │
└─────────────────────────────────┘

[IMG durak fotoğraf — tam genişlik]

┌─────────────────────────────────┐
│ Durak 3 / 5                     │  ← ilerleme
│ Galata Kulesi                   │  ← h2
│                                 │
│         [ICO play-circle, 72px] │  ← büyük oynat butonu (amber)
│                                 │
│   ◄◄  [──────●──────────]  ►►  │  ← oynatma çubuğu
│   0:42              3:15        │
│                                 │
│   [ICO volume-2]   [ICO speed]  │  ← ses seviyesi · hız (0.75x 1x 1.5x)
└─────────────────────────────────┘

≡  METİN (kaydırılabilir)  ≡
"Galata Kulesi, 1348 yılında Cenevizliler tarafından
inşa edilmiştir. Kulede gökyüzüne yetişen merdivenleri
çıktığınızda İstanbul'un eşsiz silueti..."

[BTN ghost: Sonraki Durak →]

{GPS tetikleyici aktifken bottom sheet}
┌─────────────────────────────────┐
│ 📍 Galata Köprüsü'ne 120m      │
│ Yaklaşıyorsunuz! Hazır mısın?  │
│ [BTN: Başlat] [BTN ghost: Atla]│
└─────────────────────────────────┘
```

---

## EKRAN 12 — Rota Tamamlama Modal (Overlay)

```
┌─────────────────────────────────┐
│        🎉 (konfetti animasyon)   │
│                                 │
│     Rotayı Tamamladın!          │
│                                 │
│     +100 XP  🏅 Yeni rozet     │
│     "Tarih Meraklısı" kazandın  │
│                                 │
│  ████████████ Seviye 3          │
│  Şehir Üstadı'na 250 XP kaldı   │
│                                 │
│  [ICO star × 5 tıklanabilir]    │
│  Bu rotayı değerlendirin        │
│                                 │
│  [BTN primary: Değerlendir]     │
│  [BTN ghost: Paylaş]            │
│  [BTN ghost: Keşfe Dön]         │
└─────────────────────────────────┘
```

---

## EKRAN 13 — 404 / Bulunamadı

```
┌─────────────────────────────────┐
│ ◇ Historial-GO                  │
│                                 │
│      [ICO compass, 80px, muted] │
│                                 │
│      Sayfa Bulunamadı           │
│      Bu rota kaybolmuş gibi...  │
│                                 │
│      [BTN primary: Ana Sayfaya] │
│      [BTN ghost: Keşfet]        │
└─────────────────────────────────┘
```

---

## EKRAN 14 — Hata Ekranı (API / Ağ)

```
┌─────────────────────────────────┐
│      [ICO wifi-off, 64px]       │
│                                 │
│      Bağlantı Hatası            │
│      Sunucuya ulaşılamıyor.     │
│      Çevrimdışı cache kullanılıyor│
│                                 │
│      [BTN: Tekrar Dene]         │
└─────────────────────────────────┘
```

---

## Genel Kural Özeti

| Kural | Değer |
|-------|-------|
| Dokunma hedefi minimum | 48×48px (nav: 52px) |
| Kart köşe yarıçapı | `rounded-[22px]` |
| Form input yüksekliği | `min-h-[48px]` |
| Font boyutu (input) | `text-[15px]` (iOS zoom önlemi) |
| Sayfa geçiş animasyonu | `animate-fade-in-up` (reduced-motion'da kapalı) |
| Hata kutusu | `role="alert"` — ekran okuyucu uyumlu |
| Bilgi kutusu | `role="status"` |
| Boş durum | Her zaman ikon + açıklama + CTA |
| Loading | Skeleton cards (şekil korunur) |
| Offline | Banner + cached data + retry |
