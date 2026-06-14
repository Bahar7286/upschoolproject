import { useEffect, useState } from 'react';

import { fetchWikipediaPlaceImage, isSvgPlaceholder } from '../lib/wikipedia-thumb';

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
    void fetchWikipediaPlaceImage(placeName, cityName).then((url) => {
      if (!cancelled && url) setResolved(url);
    });
    return () => {
      cancelled = true;
    };
  }, [src, placeName, cityName]);

  return resolved;
}
