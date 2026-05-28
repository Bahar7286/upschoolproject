import { Helmet } from 'react-helmet-async';
import type { ReactElement } from 'react';

import { absoluteUrl, getSiteUrl } from '../../lib/site-url';

const DEFAULT_OG = '/og-image.png';

export function PageMeta({
  title,
  description,
  path = '/',
  noindex = false,
  ogImage,
}: {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
  ogImage?: string;
}): ReactElement {
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(ogImage ?? DEFAULT_OG);
  const fullTitle = title.includes('Historial') ? title : `${title} | Historial GO`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Historial GO" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="tr_TR" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <link rel="alternate" hrefLang="tr" href={canonical} />
    </Helmet>
  );
}

export function getDefaultDescription(): string {
  return 'İstanbul ve Türkiye için kişiselleştirilmiş tarihi rotalar, sesli rehber anlatımları ve onaylı rehber içerikleri.';
}

export function getSiteBase(): string {
  return getSiteUrl();
}
