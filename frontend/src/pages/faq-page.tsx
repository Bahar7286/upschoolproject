import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { JsonLd } from '../components/seo/json-ld';
import { PageMeta } from '../components/seo/page-meta';
import { useI18n } from '../lib/i18n';

const FAQ = [
  {
    q: 'Historial GO nedir?',
    a: 'Kişiselleştirilmiş tarihi rotalar, harita üzerinde duraklar ve çok dilli sesli anlatım sunan kültür gezi platformudur.',
  },
  {
    q: 'Rotalar nasıl onaylanır?',
    a: 'Rehber rotayı incelemeye gönderir; platform yöneticisi onayladıktan sonra rehber yayınlar.',
  },
  {
    q: 'Ödeme güvenli mi?',
    a: 'Üretimde Stripe Checkout kullanılır. Demo ortamda gerçek tahsilat yapılmaz.',
  },
  {
    q: 'İade alabilir miyim?',
    a: 'Dijital içerik koşulları için iade politikası sayfamıza bakın.',
  },
];

export default function FaqPage(): ReactElement {
  const { t } = useI18n();
  return (
    <LegalPageShell title={t('legal.faqTitle', 'Sık sorulan sorular')}>
      <PageMeta
        title="SSS — Historial GO"
        description="Historial GO hakkında sık sorulan sorular: rotalar, ödeme, rehber doğrulama ve iade."
        path="/sss"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }}
      />
      <dl className="space-y-6">
        {FAQ.map((item) => (
          <div key={item.q}>
            <dt className="font-bold text-heritage-ink dark:text-stone-100">{item.q}</dt>
            <dd className="mt-1">{item.a}</dd>
          </div>
        ))}
      </dl>
    </LegalPageShell>
  );
}
