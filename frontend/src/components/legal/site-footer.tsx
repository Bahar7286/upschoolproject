import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

const EXPLORE_LINKS = [
  { to: '/discover', label: 'Keşfet' },
  { to: '/cities', label: 'İller' },
  { to: '/rehberler', label: 'Rehberler' },
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/sss', label: 'SSS' },
] as const;

const LEGAL_LINKS = [
  { to: '/terms', label: 'Kullanım Şartları' },
  { to: '/privacy', label: 'Gizlilik' },
  { to: '/kvkk', label: 'KVKK' },
  { to: '/cerezler', label: 'Çerezler' },
  { to: '/iade', label: 'İade / İptal' },
  { to: '/rehber-guven', label: 'Rehber doğrulama' },
  { to: '/odeme-guvenlik', label: 'Ödeme güvenliği' },
  { to: '/iletisim', label: 'İletişim' },
] as const;

export function SiteFooter({ className = '' }: { className?: string }): ReactElement {
  return (
    <footer className={`border-t border-stone-900/10 pt-6 text-center dark:border-white/10 ${className}`}>
      <p className="text-xs text-stone-500">Historial-GO — erken erişim turizm platformu</p>
      <nav className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold" aria-label="Keşif">
        {EXPLORE_LINKS.map(({ to, label }) => (
          <Link key={to} className="text-stone-600 hover:text-primary dark:text-stone-400" to={to}>
            {label}
          </Link>
        ))}
      </nav>
      <nav className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold" aria-label="Yasal">
        {LEGAL_LINKS.map(({ to, label }) => (
          <Link key={to} className="text-stone-600 hover:text-primary dark:text-stone-400" to={to}>
            {label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
