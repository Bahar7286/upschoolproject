import { useEffect, useState } from 'react';

import { fetchWikipediaCityImage, isSvgPlaceholder } from '../lib/wikipedia-thumb';

/** DB görseli yoksa Wikipedia'dan küçük resim dener. */
export function useRegionImage(
  src: string,
  wikiQuery?: string,
  needsFetch = false,
  wikiSlug?: string,
): string {
  const [resolved, setResolved] = useState(src);

  useEffect(() => {
    setResolved(src);
    const shouldFetch = needsFetch || isSvgPlaceholder(src);
    if (!wikiQuery || !shouldFetch) return;

    let cancelled = false;
    void fetchWikipediaCityImage(wikiQuery, wikiSlug).then((url) => {
      if (!cancelled && url) setResolved(url);
    });
    return () => {
      cancelled = true;
    };
  }, [src, wikiQuery, wikiSlug, needsFetch]);

  return resolved;
}
