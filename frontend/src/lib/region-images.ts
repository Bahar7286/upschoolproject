/** Görsel URL — önce DB (image_url), sonra Wikimedia, son olarak yerel SVG placeholder. */

const CITY_WIKI: Record<string, string> = {
  adana:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Adana_Seyhan_River_and_Sabanc%C4%B1_Mosque.jpg/640px-Adana_Seyhan_River_and_Sabanc%C4%B1_Mosque.jpg',
  istanbul:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/View_of_Levi%2C_Istanbul%2C_from_Galata_Tower.jpg/640px-View_of_Levi%2C_Istanbul%2C_from_Galata_Tower.jpg',
  ankara:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Ankara_as_seen_from_the_South.jpg/640px-Ankara_as_seen_from_the_South.jpg',
  izmir:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Kordon%2C_Izmir.jpg/640px-Kordon%2C_Izmir.jpg',
  antalya:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Antalya_City.jpg/640px-Antalya_City.jpg',
  adiyaman:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Mount_Nemrut_03.jpg/640px-Mount_Nemrut_03.jpg',
  bursa:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Bursa_City_Center.jpg/640px-Bursa_City_Center.jpg',
  gaziantep:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Gaziantep_Castle.jpg/640px-Gaziantep_Castle.jpg',
};

function slugKey(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

export function svgPlaceholderImage(label: string): string {
  const safe = (label || 'HG').slice(0, 24).replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0%" stop-color="#1e5fa8"/><stop offset="100%" stop-color="#0d3d6e"/>
  </linearGradient></defs>
  <rect width="640" height="400" fill="url(#g)"/>
  <text x="320" y="210" fill="#ffffff" font-family="system-ui,sans-serif" font-size="22" font-weight="700" text-anchor="middle">${safe}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function resolveCityImage(
  slug: string,
  cityId: number,
  imageUrl?: string | null,
): string {
  if (imageUrl?.trim()) return imageUrl.trim();
  const key = slugKey(slug);
  return CITY_WIKI[key] ?? svgPlaceholderImage(slug || `İl ${cityId}`);
}

export function resolveDistrictImage(
  citySlug: string,
  districtId: number,
  districtSlug: string,
  imageUrl?: string | null,
  districtName?: string,
): string {
  if (imageUrl?.trim()) return imageUrl.trim();
  const cityKey = slugKey(citySlug);
  if (CITY_WIKI[cityKey]) return CITY_WIKI[cityKey];
  return svgPlaceholderImage(districtName ?? districtSlug ?? `İlçe ${districtId}`);
}

export function resolvePlaceImage(
  placeId: number,
  category: string,
  imageUrl?: string | null,
  placeName?: string,
): string {
  if (imageUrl?.trim()) return imageUrl.trim();
  return svgPlaceholderImage(placeName ?? category ?? `Mekan ${placeId}`);
}

export function resolveGooglePlaceImage(
  photoUrl?: string | null,
  placeName?: string,
): string {
  if (photoUrl?.trim()) return photoUrl.trim();
  return svgPlaceholderImage(placeName ?? 'Mekan');
}
