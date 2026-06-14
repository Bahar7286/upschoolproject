import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { useI18n } from '../lib/i18n';

export default function CookiesPage(): ReactElement {
  const { t } = useI18n();
  return (
    <LegalPageShell title={t('legal.cookiesTitle', 'Çerez Politikası')}>
      <p>{t('legal.cookiesIntro', 'Giriş ve tercihler için zorunlu çerezler kullanılır; analitik çerezler yalnızca onayla.')}</p>
    </LegalPageShell>
  );
}
