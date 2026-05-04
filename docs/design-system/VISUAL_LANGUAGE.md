# Historial-GO — Görsel dil ve token’lar

Kaynaklar: `.cursor/rules/frontend/design-system.mdc`, `tailwind.config.js`, `src/styles.css`, `src/index.css`.

---

## 1. Kitle ve ton

- **Turistler:** güven, keşif, sade seçim (3–5 öneri); düşük bilişsel yük.
- **Rehberler:** şeffaf gelir, profesyonel dashboard hissi.
- **Ton:** sıcak miras (İstanbul), modern teknoloji (AI), premium ama yakın.

---

## 2. Renk

| Token | Açıklama |
|--------|-----------|
| `heritage-ink` | Ana metin / derin arka plan üstü |
| `heritage-gold` / amber | Vurgu, rozet, aktif nav |
| `primary` (#1db954) | Başarı, ilerleme, ana CTA alternatifi |
| Koyu mod | `html.dark` — arka plan ~`#0b1020`, kart ~slate-900, metin slate-100 |

Gamification: PRD’deki XP/streak renkleri design-system’deki `--color-xp`, `--color-streak` ile uyumludur (profilde placeholder).

---

## 3. Tipografi

- **Display:** `font-display` (Sora)
- **Gövde:** `font-sans` (DM Sans)
- Ölçek: başlık `text-3xl`–`text-4xl`, gövde `text-sm`–`text-base`, meta `text-xs`

---

## 4. İkonografi

- **Lucide** outlined, 1.5–2 stroke; navigasyon ve birincil eylemlerde tutarlı boyut (`h-4 w-4` / `h-5 w-5`).
- Özel logo işareti: mevcut `app-brand__mark` gradient kutusu.

---

## 5. Hareket (micro-interactions)

- `tap-scale`: basılı tutma ölçeği (~0.98)
- `animate-fade-in-up`: sayfa içi giriş (reduce-motion’da kapatılır)
- `animate-float-soft`: opsiyonel hero süsü (reduce-motion’da kapalı)
- Harita / liste: yükleme skeleton’ları (mevcut CSS)

---

## 6. Deneysel navigasyon

- **Masaüstü:** üstte çoklu sekme + ikon; yoğun menü ortalanmış.
- **Mobil:** alt 4 sekme + güvenli alan; keşif öncelikli.

Parallax: landing hero `relative overflow-hidden`; ağır JS scroll efektinden kaçınıldı (performans + kurallar).

---

## 7. Backend ile uyum

| UI | API |
|----|-----|
| Giriş/Kayıt | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| Keşfet | `GET /routes`, `POST /routes/recommend` |
| Detay | `GET /routes/:id`, `GET /routes/:routeId/stops` |
| Harita pinleri | Koordinat yoksa istemci demo yayılımı |
| Satın alım | `POST /payments`, listeler `GET /payments` |
| Rehber | `GET /guides/:id/earnings` |

---

## 8. Erişilebilirlik

- Odak: `focus-visible` / `.focus-ring`
- İkon-only: `aria-label` / `title`
- Tema döngüsü: ekran okuyucu için `aria-label` ile mod bildirimi

Bu dosya, UI değişikliklerinde güncellenmelidir.
