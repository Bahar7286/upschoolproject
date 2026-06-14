import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { SUPPORT_EMAIL } from '../config/contact';
import { useI18n } from '../lib/i18n';

export default function ContactPage(): ReactElement {
  const { t } = useI18n();
  return (
    <LegalPageShell title={t('legal.contactTitle', 'İletişim')}>
      <p>{t('legal.contactIntro', 'For support, partnerships or guide verification questions, reach us by email.')}</p>

      <div className="space-y-4 rounded-xl border border-stone-900/10 bg-stone-50 p-4 dark:border-white/10 dark:bg-zinc-800/50">
        <a
          className="flex items-center gap-3 font-semibold text-primary hover:underline"
          href={`mailto:${SUPPORT_EMAIL}?subject=Historial-GO%20Support`}
        >
          <Mail className="h-5 w-5" aria-hidden="true" />
          {SUPPORT_EMAIL}
        </a>
      </div>

      <h2 className="font-bold text-heritage-ink dark:text-stone-100">{t('footer.legalNav', 'Legal')}</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li><Link className="text-primary underline" to="/iade">{t('footer.refund', 'Refund / Cancel')}</Link></li>
        <li><Link className="text-primary underline" to="/rehber-guven">{t('footer.guideVerify', 'Guide verification')}</Link></li>
        <li><Link className="text-primary underline" to="/odeme-guvenlik">{t('footer.paymentSecurity', 'Payment security')}</Link></li>
        <li><Link className="text-primary underline" to="/kvkk">{t('footer.kvkk', 'KVKK')}</Link></li>
      </ul>
    </LegalPageShell>
  );
}
