/** Wikipedia REST özetinden küçük resim — şehir kartları için istemci yedeği. */

const cache = new Map<string, string>();

function encodeTitle(title: string): string {
  return encodeURIComponent(title.replace(/ /g, '_'));
}

async function fetchSummaryThumb(title: string, lang: string): Promise<string> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeTitle(title)}`;
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) return '';
  const data = (await resp.json()) as {
    thumbnail?: { source?: string };
    originalimage?: { source?: string };
  };
  return data.thumbnail?.source ?? data.originalimage?.source ?? '';
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

export function isSvgPlaceholder(src: string): boolean {
  return src.startsWith('data:image/svg+xml');
}
