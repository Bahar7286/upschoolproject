/** Wikipedia REST özetinden küçük resim — şehir kartları için istemci yedeği. */

const cache = new Map<string, string>();

function encodeTitle(title: string): string {
  return encodeURIComponent(title.replace(/ /g, '_'));
}

async function fetchSummaryThumb(title: string, lang: string): Promise<string> {
  const variants = [encodeTitle(title), encodeURIComponent(title.trim())];
  for (const encoded of [...new Set(variants)]) {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) continue;
    const data = (await resp.json()) as {
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
    };
    const thumb = data.thumbnail?.source ?? data.originalimage?.source ?? '';
    if (thumb) return thumb;
  }
  return '';
}

export async function fetchWikipediaCityImage(cityName: string, slug?: string): Promise<string> {
  const name = cityName.trim();
  if (!name) return '';

  const cacheKey = `${name.toLowerCase()}-${slug ?? ''}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const slugTitle = slug
    ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
    : '';
  const queries = [
    `${name} (il)`,
    name,
    slugTitle ? `${slugTitle} (il)` : '',
    slugTitle,
    `${name}, Turkey`,
  ].filter(Boolean);

  for (const q of queries) {
    for (const lang of ['tr', 'en'] as const) {
      try {
        const thumb = await fetchSummaryThumb(q, lang);
        if (thumb) {
          cache.set(cacheKey, thumb);
          return thumb;
        }
      } catch {
        /* sonraki sorgu */
      }
    }
  }
  return '';
}

/** Mekan adı — backend ile aynı sorgu sırası. */
export async function fetchWikipediaPlaceImage(
  placeName: string,
  cityName?: string,
): Promise<string> {
  const name = placeName.trim();
  if (!name) return '';

  const city = cityName?.trim() ?? '';
  const cacheKey = `place:${name.toLowerCase()}:${city.toLowerCase()}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const queries = [
    name,
    city ? `${name}, ${city}` : '',
    city ? `${name} (${city})` : '',
    `${name}, Turkey`,
  ].filter(Boolean);

  for (const q of queries) {
    for (const lang of ['tr', 'en'] as const) {
      try {
        const thumb = await fetchSummaryThumb(q, lang);
        if (thumb) {
          cache.set(cacheKey, thumb);
          return thumb;
        }
      } catch {
        /* sonraki sorgu */
      }
    }
  }
  return '';
}

export function isSvgPlaceholder(src: string): boolean {
  return src.startsWith('data:image/svg+xml');
}
