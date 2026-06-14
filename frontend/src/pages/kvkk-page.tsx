import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { SUPPORT_EMAIL } from '../config/contact';
import { useI18n } from '../lib/i18n';

export default function KvkkPage(): ReactElement {
  const { t } = useI18n();
  return (
    <LegalPageShell title={t('legal.kvkkTitle', 'KVKK Aydınlatma Metni')}>
      <p>{t('legal.kvkkIntro', 'Bu metin, kişisel verilerinizin 6698 sayılı Kanun kapsamında nasıl işlendiğini açıklar.')}</p>
      <p>
        <a className="font-semibold text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
      </p>
    </LegalPageShell>
  );
}
