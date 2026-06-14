/** İl adı karşılaştırma — Istanbul/İstanbul, ASCII/Türkçe uyumu. */

const CITY_ALIASES: Record<string, string> = {
  kapadokya: 'nevsehir',
  nevesehir: 'nevsehir',
};

export function normalizeCityKey(name: string): string {
  const n = name
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '');
  return CITY_ALIASES[n] ?? n;
}

export function cityNamesMatch(a: string, b: string): boolean {
  const na = normalizeCityKey(a);
  const nb = normalizeCityKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

/** Şehre göre filtrele — yalnızca eşleşen il. */
export function filterRoutesByCityStrict<T extends { city: string }>(routes: T[], city: string): T[] {
  if (!city.trim()) return routes;
  return routes.filter((r) => cityNamesMatch(r.city, city));
}

/** Eşleşme yoksa tüm listeyi döndür (yalnızca bilinçli yedek senaryolar için). */
export function filterRoutesByCity<T extends { city: string }>(routes: T[], city: string): T[] {
  const matched = filterRoutesByCityStrict(routes, city);
  return matched.length > 0 ? matched : routes;
}
