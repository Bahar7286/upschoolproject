import type { ReactElement } from 'react';
import {
  Award,
  Compass,
  Headphones,
  Map as MapIcon,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { BrandLogo } from '../components/brand/brand-logo';
import { ThemeToggle } from '../components/theme/theme-toggle';
import { SiteFooter } from '../components/legal/site-footer';
import { JsonLd } from '../components/seo/json-ld';
import { PageMeta, getDefaultDescription } from '../components/seo/page-meta';
import { ButtonLink } from '../components/ui/button';
import { absoluteUrl } from '../lib/site-url';

const FEATURES = [
  {
    icon: Wand2,
    title: 'Akıllı onboarding',
    text: 'Tarih, sanat, gastronomi — ilgi alanlarını seç; profilini saniyeler içinde oluştur.',
    to: '/onboarding',
  },
  {
    icon: Sparkles,
    title: 'AI rota sihirbazı',
    text: 'Süre, bütçe ve etiketlere göre en uygun rotaları öne çıkarır.',
    to: '/discover?ai=1',
  },
  {
    icon: MapIcon,
    title: 'İnteraktif harita',
    text: 'Gerçek durak koordinatları, konum takibi ve rota ilerlemesi.',
    to: '/map',
  },
  {
    icon: Headphones,
    title: 'Sesli rehberlik',
    text: 'TR / EN / DE TTS; durak anlatımları ve offline kayıt.',
    to: '/audio',
  },
  {
    icon: Award,
    title: 'Oyunlaştırma',
    text: 'XP, rozetler, streak ve haftalık sıralama — gezdikçe kazan.',
    to: '/profile',
  },
  {
    icon: Compass,
    title: 'Rehber içerikleri',
    text: 'Onaylı rehberler dijital rota oluşturur; erken aşama pazaryeri.',
    to: '/rehberler',
  },
] as const;

export default function LandingPage(): ReactElement {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-[#f4f0e8] via-[#ebe4d8] to-[#e2dbd2] text-stone-900 transition-colors duration-300 dark:from-zinc-950 dark:via-zinc-950 dark:to-black dark:text-stone-100">
      <PageMeta
        title="İstanbul Tarihi Rotaları ve Sesli Rehber"
        description={getDefaultDescription()}
        path="/"
      />
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Historial GO',
            url: absoluteUrl('/'),
            description: getDefaultDescription(),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Historial GO',
            url: absoluteUrl('/'),
          },
        ]}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(900px 520px at 80% -10%, rgb(201 162 39 / 22%), transparent 55%), radial-gradient(700px 420px at 10% 90%, rgb(29 185 84 / 12%), transparent 50%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-6 md:px-8">
        <header className="flex items-center justify-between gap-4 pt-safe">
          <BrandLogo to="/" size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ButtonLink variant="secondary" className="min-h-[44px] px-3 text-xs sm:px-4 sm:text-sm" to="/login">
              Giriş
            </ButtonLink>
            <ButtonLink className="min-h-[44px] px-3 text-xs sm:px-4 sm:text-sm" to="/register">
              Kayıt ol
            </ButtonLink>
          </div>
        </header>

        <section className="relative mt-12 overflow-hidden rounded-[28px] border border-stone-900/10 bg-gradient-to-br from-heritage-ink via-stone-900 to-stone-800 p-8 text-white shadow-lift dark:border-white/10 md:p-12">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-300">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            İstanbul · AI · B2B2C
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Şehri kendi hikayenle keşfet
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-300 md:text-lg">
            İlgi alanlarına göre AI rotaları, harita üzerinde duraklar, çok dilli sesli rehberlik ve oyunlaştırılmış kültür puanları.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink className="min-h-[52px] px-8" to="/register">
              Hemen başla
            </ButtonLink>
            <ButtonLink variant="secondary" className="min-h-[52px] border-white/30 text-white hover:border-white hover:bg-white/10" to="/discover">
              Rotalara göz at
            </ButtonLink>
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Özellikler">
          {FEATURES.map(({ icon: Icon, title, text, to }) => (
            <Link
              key={title}
              to={to}
              className="group rounded-[22px] border border-stone-900/10 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift focus-ring dark:border-white/10 dark:bg-zinc-900/95"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
              </div>
              <h2 className="font-display text-lg font-bold text-heritage-ink dark:text-stone-50">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{text}</p>
              <p className="mt-3 text-xs font-bold text-primary">Keşfet →</p>
            </Link>
          ))}
        </section>

        <SiteFooter className="mt-16" />
      </div>
    </div>
  );
}
