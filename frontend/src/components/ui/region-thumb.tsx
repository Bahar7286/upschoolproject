import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { usePlaceImage } from '../../hooks/use-place-image';
import { svgPlaceholderImage } from '../../lib/region-images';

export function RegionThumb({
  src,
  alt,
  className,
  label,
  placeName,
  cityName,
}: {
  src: string;
  alt: string;
  className?: string;
  label?: string;
  /** Verilirse SVG yer tutucu için Wikipedia görseli denenir. */
  placeName?: string;
  cityName?: string;
}): ReactElement {
  const fallback = svgPlaceholderImage(label ?? alt ?? 'HG');
  const resolved = usePlaceImage(src, placeName ?? label, cityName);
  const [current, setCurrent] = useState(resolved);

  useEffect(() => {
    setCurrent(resolved);
  }, [resolved]);

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
