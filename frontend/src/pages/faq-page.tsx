import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { JsonLd } from '../components/seo/json-ld';
import { PageMeta } from '../components/seo/page-meta';
import { useI18n } from '../lib/i18n';

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4'] as const;

export default function FaqPage(): ReactElement {
  const { t } = useI18n();
  const items = FAQ_KEYS.map((key) => ({
    q: t(`faq.${key}`, key),
    a: t(`faq.a${key.slice(1)}`, ''),
  }));

  return (
    <LegalPageShell title={t('legal.faqTitle', 'Sık sorulan sorular')}>
      <PageMeta
        title={`${t('legal.faqTitle', 'SSS')} — Historial GO`}
        description={items[0]?.a ?? ''}
        path="/sss"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }}
      />
      <dl className="space-y-6">
        {items.map((item) => (
          <div key={item.q}>
            <dt className="font-bold text-heritage-ink dark:text-stone-100">{item.q}</dt>
            <dd className="mt-1">{item.a}</dd>
          </div>
        ))}
      </dl>
    </LegalPageShell>
  );
}
