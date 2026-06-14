/** Görsel URL — önce DB (image_url), sonra Wikipedia (istemci), son olarak yerel SVG placeholder. */

const CATEGORY_GRADIENT: Record<string, [string, string]> = {
  museum: ['#1e4d8c', '#0d2847'],
  historical: ['#5c4033', '#2d1f18'],
  mosque: ['#1a5c4a', '#0a2e25'],
  restaurant: ['#8b4513', '#4a2509'],
  accommodation: ['#4a5568', '#1a202c'],
  bazaar: ['#744210', '#3d2208'],
  street: ['#2d6a4f', '#1b4332'],
  default: ['#1e5fa8', '#0d3d6e'],
};

export function svgPlaceholderImage(label?: string, category?: string): string {
  const [c1, c2] = CATEGORY_GRADIENT[category ?? ''] ?? CATEGORY_GRADIENT.default;
  const safe = (label ?? 'HG').slice(0, 24).replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="640" height="400" fill="url(#g)"/>
  <text x="320" y="210" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="26" font-weight="800">${safe}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function resolveCityImage(
  _slug: string,
  cityId: number,
  imageUrl?: string | null,
  displayName?: string,
): string {
  if (imageUrl?.trim()) return imageUrl.trim();
  return svgPlaceholderImage(displayName ?? `İl ${cityId}`);
}

export function resolveDistrictImage(
  citySlug: string,
  districtId: number,
  districtSlug: string,
  imageUrl?: string | null,
  districtName?: string,
): string {
  if (imageUrl?.trim()) return imageUrl.trim();
  return svgPlaceholderImage(districtName ?? districtSlug ?? `İlçe ${districtId}`);
}

export function resolvePlaceImage(
  placeId: number,
  category: string,
  imageUrl?: string | null,
  placeName?: string,
): string {
  if (imageUrl?.trim()) return imageUrl.trim();
  return svgPlaceholderImage(placeName ?? category ?? `Mekan ${placeId}`, category);
}

export function resolveGooglePlaceImage(
  photoUrl?: string | null,
  placeName?: string,
): string {
  if (photoUrl?.trim()) return photoUrl.trim();
  return svgPlaceholderImage(placeName ?? 'Mekan');
}
