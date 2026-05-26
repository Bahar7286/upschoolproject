# Historial-GO — Görsel Dil & Tasarım Sistemi

**Versiyon:** 2.0 | **Mayıs 2026**  
**Araçlar:** Tailwind CSS 3.4 · Lucide React · DM Sans · Sora · Capacitor

---

## 1. Ürün Kimliği & Ton

| Boyut | Tanım |
|-------|-------|
| **Karakter** | Sıcak · güvenilir · meraklı · modern |
| **İstanbul'un ruhu** | Osmanlı mirası + Ceneviz katmanları + modern yaşam |
| **Teknoloji hissi** | AI güçlü ama gösterişsiz; sizi destekliyor, bastırmıyor |
| **Duygusal hedef** | "Şehri ilk kez keşfediyormuşum gibi hissediyorum" |

### Persona'ya Göre Ton

| Persona | UI tonu | Baskın duygu |
|---------|---------|--------------|
| Meraklı Kaşif | Sıcak, davetkar, oyunsu | Keşif coşkusu |
| Lisanslı Uzman | Temiz, analitik, profesyonel | Güven + verimlilik |
| Yerel İşletmeci | Pratik, net, ROI odaklı | Fırsat |

---

## 2. Renk Sistemi

### 2.1 Marka Renkleri (Tailwind token)

```
heritage-ink    #0c1222   → Ana metin, derin başlık, koyu yüzeyler üstü
heritage-gold   #c9a227   → Altın vurgu, aktif nav, premium rozet, streak
heritage-paper  #f4f0e8   → Açık mod page background
heritage-ember  #c45c3e   → Tehlikeli durum, kritik uyarı (seyrek)
primary         #1db954   → CTA, ilerleme, başarı, XP fill
primary-dark    #158a3e   → Buton hover/pressed
```

### 2.2 Semantik Renk Haritası

| Kullanım | Açık mod | Koyu mod |
|----------|----------|---------|
| Page background | `heritage-paper` (#f4f0e8) | `zinc-950` (#09090b) |
| Kart arka planı | `white/90` + backdrop-blur | `zinc-900/95` |
| Birincil metin | `heritage-ink` | `stone-50` |
| İkincil metin | `stone-600` | `stone-400` |
| Meta / placeholder | `stone-400` | `stone-500` |
| Sınır (border) | `stone-900/10` | `white/10` |
| CTA buton | `primary` → `primary-dark` | aynı |
| Amber vurgu | `amber-500/20` bg · `amber-800` text | `amber-400/15` bg · `amber-300` text |
| Hata | `red-50` bg · `red-800` text | `red-950/40` bg · `red-100` text |
| Bilgi | `amber-500/10` bg · `amber-950` text | `amber-400/10` bg · `amber-100` text |
| Başarı | `primary/10` bg · `primary-dark` text | `primary/15` bg · `primary` text |

### 2.3 Gamification Renkleri

```
XP bar fill     → bg-primary (yeşil, #1db954)
Streak aktif    → heritage-gold / amber-500
Streak biten    → stone-300 dark:stone-600
Rozet kenar     → amber-400 (altın) / stone-300 (kilitli)
Seviye 1–2      → text-stone-600 (Gezgin, Kaşif)
Seviye 3–4      → text-amber-600 (Tarih Dostu, Şehir Üstadı)
Seviye 5        → gradient: gold → ember (Efsanevi Rehber)
Lider #1        → heritage-gold 🥇
Lider #2        → stone-400 🥈
Lider #3        → heritage-ember 🥉
```

### 2.4 Tema Modları

#### Light (Varsayılan)
```css
--bg-page:    #f4f0e8   /* heritage-paper */
--bg-card:    rgba(255,255,255,0.90)
--text-main:  #0c1222   /* heritage-ink */
--accent:     #c9a227   /* gold */
--cta:        #1db954   /* primary */
```

#### Dark
```css
--bg-page:    #09090b   /* zinc-950 */
--bg-card:    rgba(24,24,27,0.95)  /* zinc-900 */
--text-main:  #fafaf9   /* stone-50 */
--accent:     #fbbf24   /* amber-400 (koyu zeminde daha parlak) */
--cta:        #1db954
```

#### Heritage (Kişiselleştirilmiş — "Miras" modu)
```css
--bg-page:    #e8dcc8   /* sıcak sepia */
--bg-card:    rgba(232,220,200,0.85)
--text-main:  #2c1a0e   /* kahverengi ink */
--accent:     #a0722a   /* antik altın */
--cta:        #2d7a3a   /* koyu orman yeşili */
/* Tipografi: serif başlık override → Playfair Display */
/* Desen: subtle noise texture overlay (CSS: ::before opacity 0.04) */
```

#### High-Contrast (Erişilebilirlik)
```css
--bg-page:    #000000
--bg-card:    #111111
--text-main:  #ffffff
--accent:     #ffff00
--cta:        #00ff88
/* Tüm sınırlar: 2px solid white */
/* Contrast ratio: ≥ 7:1 (WCAG AAA) */
```

---

## 3. Tipografi

### Font Stack
```
font-display: 'Sora', 'Nunito', system-ui, sans-serif
font-sans:    'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif
font-mono:    'JetBrains Mono', 'Fira Code', monospace
Heritage mod: 'Playfair Display', 'Georgia', serif (başlık override)
```

### Ölçek

| Rol | Sınıf | Kullanım |
|-----|-------|---------|
| Hero başlık | `text-4xl font-extrabold font-display tracking-tight` | Landing h1 |
| Ekran başlığı | `text-2xl font-extrabold font-display tracking-tight` | Auth, onboarding h1 |
| Kart başlığı | `text-base font-bold` | Rota kartı |
| Gövde | `text-[15px] leading-relaxed font-sans` | Açıklamalar |
| Meta | `text-xs font-semibold uppercase tracking-[0.14em]` | Eyebrow, kategori |
| Caption | `text-[11px] leading-snug` | Alt bilgi, lisans |
| Input | `text-[15px]` | iOS zoom önlemi (≥16px equiv) |

### Kural
- Bir sayfada max **3 font-weight** kombinasyonu
- Başlıklarda `tracking-tight`; eyebrow'larda `tracking-[0.14em]`
- Koyu modda metin `stone-50`, ikincil `stone-400` (beyaz değil — gözü yormaz)

---

## 4. Boşluk Sistemi (8px grid)

```
space-1   4px   ikon içi padding, micro gap
space-2   8px   ikon + metin arası
space-3   12px  etiket iç padding
space-4   16px  kart iç padding (küçük)
space-5   20px  kart iç padding (standart)
space-6   24px  kart iç padding (geniş)
space-8   32px  bölüm başlığı altı
space-10  40px  seksiyon dikey padding
space-12  48px  büyük bileşen arası
space-16  64px  sayfa dikey padding (desktop)
```

---

## 5. Bileşen Kütüphanesi

### 5.1 Butonlar

**Primary (CTA)**
```
bg-primary text-white
rounded-xl min-h-[48px] px-4 py-3
font-bold text-sm
shadow-md
hover:bg-primary-dark
active:scale-[0.98] (tap-scale)
disabled:opacity-60 disabled:cursor-not-allowed
focus-ring
```

**Secondary / Outline**
```
border-2 border-stone-300 dark:border-zinc-600
bg-transparent text-stone-900 dark:text-stone-100
rounded-full min-h-[44px] px-4
font-semibold text-sm
hover:border-stone-900 dark:hover:border-white
tap-scale focus-ring
```

**Ghost / Link buton**
```
bg-transparent text-heritage-ink dark:text-stone-300
font-semibold text-sm underline-offset-4
hover:underline
tap-scale focus-ring
```

**İkon buton**
```
min-h-[44px] min-w-[44px] rounded-full
bg-white/80 dark:bg-zinc-900/80
border border-stone-900/10 dark:border-white/10
shadow-sm backdrop-blur
flex items-center justify-center
tap-scale focus-ring
```

**Chip / Filtre**
```
Pasif: border border-stone-900/15 bg-white dark:bg-zinc-950
Aktif: border-2 border-primary bg-primary/8 dark:bg-primary/10
rounded-full px-3 py-1.5 text-sm font-semibold
tap-scale
```

### 5.2 Kartlar

**Standart rota kartı**
```
rounded-[22px]
border border-stone-900/10 dark:border-white/10
bg-white/90 dark:bg-zinc-900/95
shadow-lift dark:shadow-lift-dark
backdrop-blur-md
p-5
overflow-hidden
transition-transform duration-200
hover:-translate-y-1 hover:shadow-lg (web only)
```

**Gamification stat kartı**
```
rounded-2xl border border-stone-900/8 dark:border-white/8
bg-stone-50/80 dark:bg-zinc-900/60
p-4 flex flex-col items-center gap-1
```

**Onboarding tema kart**
```
rounded-2xl border-2 p-4 cursor-pointer tap-scale
Seçilmemişse: border-stone-900/10 bg-white dark:bg-zinc-950
Seçilmişse:   border-primary bg-primary/8
```

### 5.3 Form İnputları

```
min-h-[48px] w-full rounded-xl px-4
border border-stone-900/15 dark:border-white/15
bg-white dark:bg-zinc-950
text-[15px] text-stone-900 dark:text-stone-50
placeholder:text-stone-400 dark:placeholder:text-stone-500
shadow-sm outline-none transition
focus:border-primary focus-ring
```

**Select (native)**
```
aynı input stili +
appearance-none
background-image: chevron-down SVG
```

### 5.4 Navigasyon

**Alt nav (mobil / native)**
```
fixed bottom-0 left-0 right-0 z-50
border-t border-stone-900/10 dark:border-white/10
bg-white/95 dark:bg-zinc-950/98
backdrop-blur-xl
pb-safe (env(safe-area-inset-bottom))
grid grid-cols-4
```

Sekme öğesi:
```
min-h-[52px] flex flex-col items-center justify-center gap-1
text-[11px] font-bold tap-scale
Pasif:  text-stone-500 dark:text-stone-400
Aktif:  text-primary (ikon dolgu/solid varyant)
        background: bg-primary/8 rounded-xl
```

**Üst nav (masaüstü)**
```
sticky top-0 z-40
bg-heritage-paper/95 dark:bg-zinc-950/95
border-b border-stone-900/10 dark:border-white/10
backdrop-blur-xl
pt-safe
```

### 5.5 XP & Seviye Bar

```
İlerleme çubuğu:
  h-2.5 rounded-full bg-stone-200 dark:bg-zinc-800
  İç dolgu: bg-primary transition-all duration-700 ease-out (animate-in)
  Etiket: seviye adı + XP text-xs

Streak badge:
  inline-flex items-center gap-1 rounded-full px-2.5 py-1
  bg-amber-500/15 text-amber-700 dark:text-amber-300
  text-xs font-bold
  [ICO flame, h-3.5] · {N} gün
```

### 5.6 Rozet Bileşeni

```
Kazanılmış:
  w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600
  shadow-md flex items-center justify-center
  [ICO veya emoji, h-8] text-white
  alt: rozet adı (erişilebilirlik)

Kilitli:
  aynı ama grayscale opacity-40
  blur overlay: rounded-2xl bg-black/20
  [ICO lock, h-5] alt köşede
```

### 5.7 AI Öneri Paneli

```
rounded-[22px] border border-primary/25 bg-primary/5 dark:bg-primary/8
p-5 flex flex-col gap-3

Başlık satırı:
  [ICO sparkles, amber] "AI Önerin"  font-bold text-sm

Tercih özet satırı:
  [chip: Tarih] [chip: Mimari] · 2 sa · ₺100
  chip: rounded-full bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 text-xs

CTA:
  [BTN primary: Rotaları öner →]
  loading state: "Öneri hazırlanıyor..." + spinner
```

---

## 6. İkonografi

### Kütüphane Kuralları
- **Tek kaynak:** `lucide-react` (outlined)
- **Stroke:** `strokeWidth={2}` standard · `strokeWidth={2.5}` küçük ikonlar (≤16px)
- **Boyutlar:** `h-4 w-4` (inline) · `h-5 w-5` (UI standart) · `h-6 w-6` (aksiyon) · `h-7 w-7` (featured)
- Dekoratif: `aria-hidden="true"` · Anlamlı (ikon-only buton): `aria-label="..."`

### Ekrana Özel İkon Seti

| Ekran / Bileşen | İkon | Notlar |
|-----------------|------|--------|
| Alt nav: Keşfet | `compass` | Aktifse `compass` fill efekti (filled variant yok → bg circle) |
| Alt nav: Harita | `map` | |
| Alt nav: Satın alımlar | `shopping-bag` | |
| Alt nav: Profil | `user` | |
| Giriş | `log-in` | |
| Kayıt | `user-plus` | |
| Rota | `route` | |
| Durak | `map-pin` | Amber renk |
| Sesli rehber | `play-circle` (büyük) · `mic` (küçük) | |
| XP | `zap` | Heritage-gold |
| Streak | `flame` | Amber-500 |
| Rozet | `award` | |
| Liderlik | `trophy` | |
| AI öneri | `sparkles` | Amber, animated shimmer |
| Tema geçiş | `sun` · `moon` · `monitor` | döngü |
| Çevrimdışı | `wifi-off` | |
| Hata | `alert-circle` | |
| Başarı | `check-circle` | Primary |
| Şifre göster/gizle | `eye` · `eye-off` | |
| Rehber paneli | `bar-chart-2` | |
| Gelir | `banknote` | |
| Filtre | `sliders-horizontal` | |

---

## 7. Gölgeler

```
shadow-sm:        0 1px 3px rgb(0 0 0 / 8%)    → input, küçük kart
shadow-lift:      0 8px 24px rgb(0 0 0 / 12%)  → ana kart (açık mod)
shadow-lift-dark: 0 12px 40px rgb(0 0 0 / 45%) → ana kart (koyu mod)
shadow-md:        Tailwind default              → modal, dropdown
shadow-none:      düz, renk ayrımı sınırla     → native hissi gereken yerlerde
```

---

## 8. Köşe Yarıçapları

```
rounded-sm    4px   ─ küçük rozet, etiket, chip (küçük)
rounded-lg    8px   ─ badge, stat kutu
rounded-xl    12px  ─ input, küçük kart, chip
rounded-2xl   16px  ─ buton, nav öğesi, orta kart
rounded-[22px]      ─ ana auth/rota kartları (özel)
rounded-3xl   24px  ─ hero banner, full bleed kart
rounded-full        ─ avatar, pill, toggle, ikon buton
```

---

## 9. Animasyon & Micro-Interaction

### Tanımlı Keyframe'ler (tailwind.config.js)

```js
fade-in-up:    opacity 0→1, translateY 10px→0, 550ms ease-out
float-soft:    translateY 0→-6px→0, 5.5s ease-in-out infinite
shimmer:       background-position -200%→200%, 1.5s linear infinite  ← skeleton
confetti:      scale + rotate + opacity, 600ms  ← rota tamamlama
xp-pulse:      scale 1→1.08→1, 300ms  ← XP kazanımı
badge-pop:     scale 0.5→1.1→1 + opacity 0→1, 400ms bounce  ← rozet kazanımı
```

### Kurallar

| Kural | Detay |
|-------|-------|
| `prefers-reduced-motion` | Tüm CSS animasyonları `animation: none !important` |
| Kart hover | Web'de `-translate-y-1`; native'de `active:scale-[0.98]` |
| Sayfa geçişi | `animate-fade-in-up` + `animation-delay` (stagger: 60ms × index) |
| Buton basış | `tap-scale` (`active:scale-[0.98]`, 150ms) |
| XP kazanımı | Sayı +N counter animasyonu + `xp-pulse` |
| Rozet | `badge-pop` modal overlay |
| Skeleton | `shimmer` gradient sweep |
| Tema geçişi | `transition-colors duration-300` tüm sayfada |
| Sesli rehber | waveform SVG animation (CSS stroke-dashoffset) |
| Konfetti | JS (canvas-confetti veya CSS keyframe parçacıklar) |

### Neyi Asla Yapma
- Sürekli döngü animasyonu (loading dışında) → pil tüketimi
- Ağır parallax (scroll-linked JS) → performans
- 3+ özelliği aynı anda animate etme
- `hover:` tek etkileşim noktası (mobilde hover yok)

---

## 10. Kişiselleştirilmiş Mod Uygulaması (Kod Düzeyi)

### ThemeStore (zustand)

```typescript
type Theme = 'system' | 'light' | 'dark' | 'heritage' | 'high-contrast';

interface ThemeStore {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: 'light' | 'dark';  // system → resolved
}
```

### ThemeSync (bileşen)

```typescript
// html element üzerinde:
html.classList: 'dark' veya '' (Tailwind dark mode)
html.dataset.theme: 'heritage' | 'high-contrast' | '' (CSS override)
```

### CSS Override (heritage modu)

```css
[data-theme="heritage"] {
  --bg-page: #e8dcc8;
  --font-display: 'Playfair Display', serif;
  background: var(--bg-page);
  font-family: var(--font-display);
}

[data-theme="heritage"] .auth-heading {
  font-family: 'Playfair Display', serif;
  letter-spacing: -0.02em;
}
```

### Profil Entegrasyonu
Kullanıcı seçtiği tema `user.preferences.theme` olarak kaydedilir.  
Her girişte `fetchCurrentUser` sonrası `ThemeStore.setTheme(me.preferences.theme)`.

---

## 11. Erişilebilirlik (WCAG 2.1 AA)

| Kural | Uygulama |
|-------|---------|
| Kontrast: gövde | ≥ 4.5:1 (AA) |
| Kontrast: büyük metin | ≥ 3:1 |
| Dış mekan görünürlüğü | Koyu modda yüksek kontrast tercih et |
| Touch target | 48×48px minimum |
| Focus ring | `focus-visible:outline-2 outline-offset-2 outline-primary` |
| İkon-only buton | `aria-label="..."` zorunlu |
| Hata bildirimi | `role="alert"` (anlık duyuru) |
| Durum bildirimi | `role="status"` (nazik) |
| Animasyon | `prefers-reduced-motion` desteği |
| Renk tek bilgi taşıyıcı | Her zaman ikon veya metin eşliği |
| Form label | `htmlFor` + `id` eşleştirmesi |
| Rozet kilitli | `aria-disabled="true"` + tooltip |

---

## 12. Görsel Dil Özet Tablosu

| Öge | Açık | Koyu | Heritage |
|-----|------|------|---------|
| Background | heritage-paper | zinc-950 | sepia #e8dcc8 |
| Kart | white/90 blur | zinc-900/95 | parchment |
| Başlık font | Sora | Sora | Playfair Display |
| Vurgu | amber-500 | amber-400 | antik altın #a0722a |
| CTA | #1db954 | #1db954 | #2d7a3a |
| Sınır | stone/10 | white/10 | tan/20 |
| Gölge | shadow-lift | shadow-lift-dark | shadow-sm |
| Arka plan desen | radial gradient | radial gradient | noise texture |

---

Bu doküman `docs/ux/USER_FLOW.md`, `docs/ux/WIREFRAMES.md` ve `.cursor/rules/frontend/design-system.mdc` ile birlikte okunmalıdır.  
Tailwind token değerleri `frontend/tailwind.config.js`'te tanımlıdır.
