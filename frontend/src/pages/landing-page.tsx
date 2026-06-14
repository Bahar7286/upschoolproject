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
import { AuthPageShell } from '../components/layout/auth-page-shell';
import { ThemeToggle } from '../components/theme/theme-toggle';
import { SiteFooter } from '../components/legal/site-footer';
import { JsonLd } from '../components/seo/json-ld';
import { PageMeta, getDefaultDescription } from '../components/seo/page-meta';
import { ButtonLink } from '../components/ui/button';
import { useI18n } from '../lib/i18n';
import { absoluteUrl } from '../lib/site-url';

const FEATURE_KEYS = [
  { icon: Wand2, titleKey: 'landing.featureOnboarding', descKey: 'landing.featureOnboardingDesc', to: '/onboarding' },
  { icon: Sparkles, titleKey: 'landing.featureAi', descKey: 'landing.featureAiDesc', to: '/discover?ai=1' },
  { icon: MapIcon, titleKey: 'landing.featureMap', descKey: 'landing.featureMapDesc', to: '/map' },
  { icon: Headphones, titleKey: 'landing.featureAudio', descKey: 'landing.featureAudioDesc', to: '/cities' },
  { icon: Award, titleKey: 'landing.featureGamification', descKey: 'landing.featureGamificationDesc', to: '/profile' },
  { icon: Compass, titleKey: 'landing.featureGuides', descKey: 'landing.featureGuidesDesc', to: '/rehberler' },
] as const;

export default function LandingPage(): ReactElement {
  const { t } = useI18n();

  return (
    <AuthPageShell>
      <PageMeta
        title={t('landing.heroTitle', 'Türkiye\'yi AI rotalarla keşfet')}
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
      <div className="relative mx-auto max-w-6xl px-4 py-6 md:px-8">
        <header className="flex items-center justify-between gap-4 pt-safe">
          <BrandLogo to="/" size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <ButtonLink variant="secondary" className="min-h-[44px] px-3 text-xs sm:px-4 sm:text-sm" to="/login">
              {t('landing.ctaLogin', 'Giriş yap')}
            </ButtonLink>
            <ButtonLink className="min-h-[44px] px-3 text-xs sm:px-4 sm:text-sm" to="/register">
              {t('landing.ctaRegister', 'Kayıt ol')}
            </ButtonLink>
          </div>
        </header>

        <section className="landing-hero relative mt-12 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-heritage-ink via-stone-900 to-stone-800 p-8 text-white shadow-lift md:p-12">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-300">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Historial-GO
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            {t('landing.heroTitle', 'Türkiye\'yi AI rotalarla keşfet')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-200 md:text-lg">
            {t('landing.heroSubtitle', 'Akıllı onboarding, canlı harita, sesli rehber ve doğrulanmış rehberler.')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink className="min-h-[52px] px-8" to="/register">
              {t('landing.ctaDiscover', 'Keşfe başla')}
            </ButtonLink>
            <ButtonLink variant="secondary" className="min-h-[52px] border-white/30 text-white hover:border-white hover:bg-white/10" to="/discover">
              {t('common.exploreDiscover', 'Rotaları keşfet')}
            </ButtonLink>
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={t('landing.featureOnboarding', 'Features')}>
          {FEATURE_KEYS.map(({ icon: Icon, titleKey, descKey, to }) => (
            <Link
              key={titleKey}
              to={to}
              className="theme-card group rounded-[22px] p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift focus-ring"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
              </div>
              <h2 className="font-display text-lg font-bold text-theme">{t(titleKey, titleKey)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-theme-muted">{t(descKey, descKey)}</p>
              <p className="mt-3 text-xs font-bold text-primary">{t('common.discover', 'Keşfet')} →</p>
            </Link>
          ))}
        </section>

        <SiteFooter className="mt-16" />
      </div>
    </AuthPageShell>
  );
}
