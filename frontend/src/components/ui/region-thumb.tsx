import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { svgPlaceholderImage } from '../../lib/region-images';

export function RegionThumb({
  src,
  alt,
  className,
  label,
}: {
  src: string;
  alt: string;
  className?: string;
  label?: string;
}): ReactElement {
  const fallback = svgPlaceholderImage(label ?? alt ?? 'HG');
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(src);
  }, [src]);

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
