import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { useI18n } from '../lib/i18n';

export default function PrivacyPage(): ReactElement {
  const { t } = useI18n();
  return (
    <LegalPageShell title={t('legal.privacyTitle', 'Gizlilik Politikası')}>
      <p>{t('legal.privacyIntro', 'Historial-GO processes personal data in line with KVKK and GDPR principles.')}</p>
      <p>
        <Link className="font-semibold text-primary underline" to="/kvkk">KVKK</Link>
        {' · '}
        <Link className="font-semibold text-primary underline" to="/cerezler">{t('footer.cookies', 'Cookies')}</Link>
      </p>
    </LegalPageShell>
  );
}
