import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { PageMeta, getDefaultDescription } from '../components/seo/page-meta';
import { JsonLd } from '../components/seo/json-ld';
import { absoluteUrl } from '../lib/site-url';
import { useI18n } from '../lib/i18n';

export default function AboutPage(): ReactElement {
  const { t } = useI18n();
  return (
    <LegalPageShell title={t('legal.aboutTitle', 'Hakkımızda')}>
      <PageMeta
        title={`${t('legal.aboutTitle', 'Hakkımızda')} — Historial GO`}
        description={t('legal.aboutIntro', 'Historial-GO is an early-access tourism platform.')}
        path="/hakkimizda"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Historial GO',
          url: absoluteUrl('/'),
          description: getDefaultDescription(),
        }}
      />
      <p>{t('legal.aboutIntro', 'Historial-GO is an early-access tourism platform combining AI routes, live maps, audio guides and verified guide content.')}</p>
    </LegalPageShell>
  );
}
