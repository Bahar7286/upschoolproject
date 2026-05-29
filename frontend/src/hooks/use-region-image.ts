import { useEffect, useState } from 'react';

import { fetchWikipediaCityImage, isSvgPlaceholder } from '../lib/wikipedia-thumb';

/** Statik yedekten sonra Wikipedia'dan görsel dener. */
export function useRegionImage(src: string, wikiQuery?: string): string {
  const [resolved, setResolved] = useState(src);

  useEffect(() => {
    setResolved(src);
    if (!wikiQuery || !isSvgPlaceholder(src)) return;

    let cancelled = false;
    void fetchWikipediaCityImage(wikiQuery).then((url) => {
      if (!cancelled && url) setResolved(url);
    });
    return () => {
      cancelled = true;
    };
  }, [src, wikiQuery]);

  return resolved;
}
