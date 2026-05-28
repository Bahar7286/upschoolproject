import { Helmet } from 'react-helmet-async';
import type { ReactElement } from 'react';

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }): ReactElement {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(payload.length === 1 ? payload[0] : payload)}</script>
    </Helmet>
  );
}
