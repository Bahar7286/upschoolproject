import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { useI18n } from '../lib/i18n';

export default function GuideTrustPage(): ReactElement {
  const { t } = useI18n();
  return (
    <LegalPageShell title={t('legal.guideTrustTitle', 'Rehber Doğrulama')}>
      <p>{t('legal.guideTrustIntro', 'Doğrulanmış rehberler lisans ve eğitim belgelerini sunar. Rozet gösterimi için admin onayı gerekir.')}</p>
    </LegalPageShell>
  );
}
