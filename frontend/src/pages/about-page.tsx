import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { PageMeta, getDefaultDescription } from '../components/seo/page-meta';
import { JsonLd } from '../components/seo/json-ld';
import { absoluteUrl } from '../lib/site-url';

export default function AboutPage(): ReactElement {
  return (
    <LegalPageShell title="Hakkımızda">
      <PageMeta
        title="Hakkımızda — Historial GO"
        description="Historial GO: Türkiye kültür rotaları, sesli rehberlik ve onaylı rehber içerikleri platformu."
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
      <p>
        Historial GO, rehberlerin dijital rota içerikleri oluşturabildiği erken aşama bir turizm platformudur.
        Gezginler ilgi alanlarına göre rotalar keşfeder, haritada durakları gezer ve sesli anlatımları dinler.
      </p>
      <h2 className="font-bold">Misyon</h2>
      <p>
        Kaçak rehberlik riskine karşı lisanslı profesyonelleri desteklemek; kültür turizmini kişiselleştirilmiş ve
        erişilebilir hale getirmek.
      </p>
      <h2 className="font-bold">Ekip</h2>
      <p>Üniversite tabanlı girişim ekibi — İstanbul ve Türkiye genelinde pilot içerikler.</p>
    </LegalPageShell>
  );
}
