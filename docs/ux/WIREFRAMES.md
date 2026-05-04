# Historial-GO — Wireframe referansı (web MVP)

Ölçü: **mobil öncelik**, üst bar ~64px, alt tab bar ~52px + safe-area. Tipografi: **Sora** başlık, **DM Sans** gövde (design-system ile uyumlu).

---

## Ortak kabuk (giriş sonrası)

```
┌─────────────────────────────────────────────┐
│ [◇ Logo]   Keşfet Harita …    [☾ tema][Çıkış] │  ← sticky, blur
├─────────────────────────────────────────────┤
│                                             │
│              SAYFA İÇERİĞİ                  │
│                                             │
├─────────────────────────────────────────────┤
│ [ Keşfet ] [ Harita ] [ Satın ] [ Profil ]   │  ← mobil alt nav (ikon+label)
└─────────────────────────────────────────────┘
```

---

## Landing `/`

```
        [ Logo Historial-GO          (☾) Giriş | Kayıt ]

┌─────────────────────────────────────────────┐
│ ✦ İstanbul · AI kişiselleştirme             │
│ Şehri kendi hikayenle keşfet               │  ← koyu gradient hero
│ ...                                        │
│ [ Hemen başla ]  [ Rotalara göz at ]       │
│ • Güven maddeleri                          │
└─────────────────────────────────────────────┘

[ Kart ] [ Kart ] [ Kart ]   ← MVP modülleri grid
```

---

## Keşfet `/discover`

```
Başlık + kısa açıklama

┌─ AI öneri paneli ─────────────────────────┐
│ İlgi: history, art · 120 dk · ₺150       │
│                      [ AI ile öner ]       │
└──────────────────────────────────────────┘

┌──────┐ ┌──────┐ ┌──────┐
│ Şehir │ │ Şehir │ │ Şehir │   ← rota kartları (gradient başlık)
│ başlık│ │ başlık│ │ başlık│
│ meta  │ │ meta  │ │ meta  │
│[Detay]│ │[Detay]│ │[Detay]│
└──────┘ └──────┘ └──────┘
```

---

## Harita `/map`

```
Başlık + OSM/Google açıklaması

[ OSM/Leaflet | Google (anahtar varsa) ]

┌─────────────────────────────────────────┐
│ ██████ harita döşemesi + pin popup       │
│                                        █ │
└─────────────────────────────────────────┘

[ Konumumu göster ] [ Aktif rotayı takip et ]
```

---

## Rota detay `/routes/:id`

```
Keşfet / Başlık

Başlık · süre · fiyat · rehber id
[ Satın al ] [ Haritada gör ]

Duraklar
 ① başlık — açıklama — koordinat — [ TTS dinle ]
 ② ...
```

---

## Profil `/profile` (korumalı)

```
Avatar | Ad · e-posta · rol rozeti

┌ Kültür puanı ┐ ┌ Rozetler ┐ ┌ Liderlik ┐
└─────────────┘ └──────────┘ └──────────┘
```

---

## Rehber paneli `/guide` (korumalı, role=guide)

```
Bu ay net │ Satış adedi │ Sonraki adım CTA
(Rehber değilse: bilgilendirme + kayıt linki)
```

---

## Oturum `/login` · `/register`

```
┌──────────────────┐
│ Başlık           │
│ E-posta          │
│ Şifre            │
│ [ Birincil CTA ] │
│ Yardımcı link    │
└──────────────────┘
```

Tüm formlar **min 44px** dokunma yüksekliği; hata mesajları `role="alert"`.

Bu wireframe’ler `VISUAL_LANGUAGE` token’larıyla birlikte kullanılmalıdır (`docs/design-system/VISUAL_LANGUAGE.md`).
