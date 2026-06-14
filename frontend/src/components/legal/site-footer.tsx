import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useI18n } from '../../lib/i18n';

export function SiteFooter({ className = '' }: { className?: string }): ReactElement {
  const { t } = useI18n();

  const exploreLinks = [
    { to: '/discover', label: t('nav.discover', 'Keşfet') },
    { to: '/cities', label: t('nav.cities', 'İller') },
    { to: '/rehberler', label: t('nav.guides', 'Rehberler') },
    { to: '/hakkimizda', label: t('footer.about', 'Hakkımızda') },
    { to: '/sss', label: t('footer.faq', 'SSS') },
  ] as const;

  const legalLinks = [
    { to: '/terms', label: t('footer.terms', 'Kullanım Şartları') },
    { to: '/privacy', label: t('footer.privacy', 'Gizlilik') },
    { to: '/kvkk', label: t('footer.kvkk', 'KVKK') },
    { to: '/cerezler', label: t('footer.cookies', 'Çerezler') },
    { to: '/iade', label: t('footer.refund', 'İade / İptal') },
    { to: '/rehber-guven', label: t('footer.guideVerify', 'Rehber doğrulama') },
    { to: '/odeme-guvenlik', label: t('footer.paymentSecurity', 'Ödeme güvenliği') },
    { to: '/iletisim', label: t('footer.contact', 'İletişim') },
  ] as const;

  return (
    <footer className={`border-t border-stone-900/10 pt-6 text-center dark:border-white/10 ${className}`}>
      <p className="text-xs text-stone-500">{t('footer.tagline', 'Historial-GO — erken erişim turizm platformu')}</p>
      <nav className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold" aria-label={t('footer.exploreNav', 'Keşif')}>
        {exploreLinks.map(({ to, label }) => (
          <Link key={to} className="text-stone-600 hover:text-primary dark:text-stone-400" to={to}>
            {label}
          </Link>
        ))}
      </nav>
      <nav className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold" aria-label={t('footer.legalNav', 'Yasal')}>
        {legalLinks.map(({ to, label }) => (
          <Link key={to} className="text-stone-600 hover:text-primary dark:text-stone-400" to={to}>
            {label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
