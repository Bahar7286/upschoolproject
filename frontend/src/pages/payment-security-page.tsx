import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { useI18n } from '../lib/i18n';

export default function PaymentSecurityPage(): ReactElement {
  const { t } = useI18n();
  return (
    <LegalPageShell title={t('legal.paymentSecurityTitle', 'Ödeme Güvenliği')}>
      <p>{t('legal.paymentSecurityIntro', 'Kart verileri Stripe veya demo ödeme ile işlenir; tam kart numarası saklanmaz.')}</p>
    </LegalPageShell>
  );
}
