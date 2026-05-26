# DesignSystem.md — Renk, tipografi ve bileşen kuralları

**Ürün:** Historial-GO · **Uygulama:** `frontend/tailwind.config.js`, `frontend/src/index.css`  
**Detaylı referans:** [docs/design-system/VISUAL_LANGUAGE.md](docs/design-system/VISUAL_LANGUAGE.md)

---

## 1. Tasarım ilkeleri

1. **Sadelik** — Sayfa başına en fazla 3–5 net öneri/CTA (PRD §9).
2. **Güven** — Onaylı rehber rozeti, şeffaf yorumlar.
3. **Keşif** — Haritada vurgulu POI; gamification ile ilerleme hissi.
4. **Erişilebilirlik** — Dokunma hedefi ≥44px; kontrast WCAG hedefi; `high-contrast` tema.

---

## 2. Renk paleti

### Marka token’ları (Tailwind)

| Token | Hex | Kullanım |
|-------|-----|----------|
| `heritage-ink` | `#0c1222` | Ana metin, koyu başlık |
| `heritage-gold` | `#c9a227` | Premium vurgu, aktif nav, streak |
| `heritage-paper` | `#f4f0e8` | Açık mod sayfa arka planı |
| `heritage-ember` | `#c45c3e` | Kritik uyarı (seyrek) |
| `primary` | `#1db954` | CTA, başarı, XP çubuğu |
| `primary-dark` | `#158a3e` | Buton hover |

### Semantik yüzeyler

| Öğe | Açık mod | Koyu mod |
|-----|----------|----------|
| Sayfa | `bg-heritage-paper` | `bg-zinc-950` |
| Kart | `bg-white/90` + `backdrop-blur` | `bg-zinc-900/95` |
| Birincil metin | `text-heritage-ink` | `text-stone-50` |
| İkincil | `text-stone-600` | `text-stone-400` |
| Kenarlık | `border-stone-900/10` | `border-white/10` |

### Gamification

- XP dolgu: `bg-primary`
- Streak: `heritage-gold` / `amber-500`
- Liderlik: altın / gümüş / ember (1.–3.)

---

## 3. Tipografi

| Rol | Font | Tailwind sınıfı |
|-----|------|-----------------|
| Başlık / hero | Sora | `font-display text-4xl font-extrabold tracking-tight` |
| Ekran başlığı | Sora | `text-2xl font-extrabold font-display` |
| Gövde | DM Sans | `font-sans text-[15px] leading-relaxed` |
| Eyebrow / meta | DM Sans | `text-xs font-semibold uppercase tracking-[0.14em]` |
| Heritage mod başlık | Playfair / Georgia | `font-serif` (tema override) |

**Kurallar**

- Bir sayfada en fazla **3 font-weight** kombinasyonu.
- Form input metni **≥15px** (mobil zoom önlemi).
- Koyu modda saf beyaz yerine `stone-50` / `stone-400`.

---

## 4. Boşluk (8px grid)

`4 → 8 → 12 → 16 → 20 → 24 → 32 → 40 → 48 → 64` px  
Kart içi standart: `p-5` (20px). Sayfa yatay: `px-4` mobil, `px-6` tablet+.

---

## 5. Bileşen kuralları

### Buton (`src/components/ui/button.tsx`)

| Varyant | Görünüm | Davranış |
|---------|---------|----------|
| Primary | `bg-primary text-white rounded-xl min-h-[48px]` | `hover:bg-primary-dark`, `active:scale-[0.98]` |
| Outline | `border-2 rounded-full min-h-[44px]` | İkincil aksiyon |
| Ghost | Şeffaf, `underline` hover | Metin linkleri |
| İkon | `min-h-[44px] min-w-[44px] rounded-full` | Harita, tema |

### Kart

- Rota kartı: `rounded-[22px]`, `shadow-lift`, `border-stone-900/10`, `p-5`
- Stat kartı: `rounded-2xl`, `StatCard` bileşeni
- Hover (sadece web): `-translate-y-1`

### Form

```
min-h-[48px] rounded-xl px-4
border border-stone-900/15 dark:border-white/15
focus:ring-2 focus:ring-primary/40
```

### Navigasyon

- Mobil alt nav: `mobile-bottom-nav.tsx`, aktif öğe `heritage-gold` / `primary`
- Masaüstü: `app-layout` sidebar

### Rozet / chip

- Filtre chip: pasif outline; aktif `border-primary bg-primary/10`
- `VerifiedGuideBadge`: onaylı rehber

---

## 6. Tema modları

| Mod | Anahtar | Not |
|-----|---------|-----|
| Light | varsayılan | `heritage-paper` zemin |
| Dark | `class="dark"` | `theme-store` |
| Heritage | kişiselleştirilmiş | Sepia zemin, serif başlık |
| High-contrast | erişilebilirlik | Yüksek kontrast sınıfları |

Tema senkronu: `theme-sync.tsx`, meta: `theme-meta.ts`.

---

## 7. İkon ve hareket

- **İkon seti:** Lucide React, tutarlı `size={20|24}`
- **Animasyon:** `fade-in-up`, `float-soft` (`tailwind.config.js`)
- **Azaltılmış hareket:** `prefers-reduced-motion` ile animasyon kapatma (CSS)

---

## 8. Yeni bileşen eklerken

1. Önce bu belgedeki token ve yükseklik kurallarına uy.
2. Renk için yeni hex üretme; `heritage-*` veya `primary` kullan.
3. Ortak UI’ı `src/components/ui/` altında topla.
4. Sayfa özelinde tekrar etme; mevcut `button`, `stat-card` genişlet.
