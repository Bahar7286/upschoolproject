/** Görsel URL — önce DB (image_url), sonra Wikimedia, son olarak yerel SVG placeholder. */

const CITY_WIKI: Record<string, string> = {
  adana:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Adana_Seyhan_River_and_Sabanc%C4%B1_Mosque.jpg/640px-Adana_Seyhan_River_and_Sabanc%C4%B1_Mosque.jpg',
  istanbul:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Istanbul_panorama_from_Galata_Tower.jpg/640px-Istanbul_panorama_from_Galata_Tower.jpg',
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
  mersin:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Mersin_City_Center.jpg/640px-Mersin_City_Center.jpg',
  kayseri:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Kayseri_Castle.jpg/640px-Kayseri_Castle.jpg',
  kars:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Kars_City.jpg/640px-Kars_City.jpg',
  kastamonu:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Kastamonu_City.jpg/640px-Kastamonu_City.jpg',
  kirklareli:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/K%C4%B1rklareli_City.jpg/640px-K%C4%B1rklareli_City.jpg',
  kirsehir:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/K%C4%B1r%C5%9Fehir_City.jpg/640px-K%C4%B1r%C5%9Fehir_City.jpg',
  trabzon:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Trabzon_City.jpg/640px-Trabzon_City.jpg',
  samsun:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Samsun_City.jpg/640px-Samsun_City.jpg',
  eskisehir:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Eski%C5%9Fehir_City.jpg/640px-Eski%C5%9Fehir_City.jpg',
  mugla:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Mu%C4%9Fla_City.jpg/640px-Mu%C4%9Fla_City.jpg',
  denizli:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Denizli_City.jpg/640px-Denizli_City.jpg',
  nevsehir:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/G%C3%B6reme_National_Park.jpg/640px-G%C3%B6reme_National_Park.jpg',
  canakkale:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/%C3%87anakkale_City.jpg/640px-%C3%87anakkale_City.jpg',
  edirne:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Edirne_Selimiye_Mosque.jpg/640px-Edirne_Selimiye_Mosque.jpg',
  van:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Van_City.jpg/640px-Van_City.jpg',
  diyarbakir:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Diyarbak%C4%B1r_City_Walls.jpg/640px-Diyarbak%C4%B1r_City_Walls.jpg',
};

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

export function svgPlaceholderImage(label?: string, category?: string): string {
  const [c1, c2] = CATEGORY_GRADIENT[category ?? ''] ?? CATEGORY_GRADIENT.default;
  const safe = (label ?? 'HG').slice(0, 24).replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="640" height="400" fill="url(#g)"/>
  <text x="320" y="210" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="system-ui,sans-serif" font-size="22" font-weight="700">${safe}</text>
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
  return svgPlaceholderImage(placeName ?? category ?? `Mekan ${placeId}`, category);
}

export function resolveGooglePlaceImage(
  photoUrl?: string | null,
  placeName?: string,
): string {
  if (photoUrl?.trim()) return photoUrl.trim();
  return svgPlaceholderImage(placeName ?? 'Mekan');
}
