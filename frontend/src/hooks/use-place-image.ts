import { useEffect, useState } from 'react';

import { isSvgPlaceholder } from '../lib/wikipedia-thumb';
import { fetchWikipediaCityImage } from '../lib/wikipedia-thumb';

/** Mekan kartları — DB görseli yoksa Wikipedia'dan küçük resim dener. */
export function usePlaceImage(
  src: string,
  placeName?: string,
  cityName?: string,
): string {
  const [resolved, setResolved] = useState(src);

  useEffect(() => {
    setResolved(src);
    if (!placeName?.trim() || !isSvgPlaceholder(src)) return;

    let cancelled = false;
    const query = cityName ? `${placeName}, ${cityName}` : placeName;
    void fetchWikipediaCityImage(query).then((url) => {
      if (!cancelled && url) setResolved(url);
    });
    return () => {
      cancelled = true;
    };
  }, [src, placeName, cityName]);

  return resolved;
}
