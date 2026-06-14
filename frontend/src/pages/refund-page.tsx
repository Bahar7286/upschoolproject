import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { useI18n } from '../lib/i18n';

export default function RefundPage(): ReactElement {
  const { t } = useI18n();
  return (
    <LegalPageShell title={t('legal.refundTitle', 'İade / İptal')}>
      <p>{t('legal.refundIntro', 'Dijital rota satın alımları, içerik önemli ölçüde kullanılmadıysa 14 gün içinde iade edilebilir.')}</p>
    </LegalPageShell>
  );
}
