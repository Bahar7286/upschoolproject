/** İl adı karşılaştırma — Istanbul/İstanbul, ASCII/Türkçe uyumu. */

export function normalizeCityKey(name: string): string {
  return name
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
}

export function cityNamesMatch(a: string, b: string): boolean {
  const na = normalizeCityKey(a);
  const nb = normalizeCityKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

/** Şehre göre filtrele; eşleşme yoksa tüm listeyi döndür (boş ekran önleme). */
export function filterRoutesByCity<T extends { city: string }>(routes: T[], city: string): T[] {
  if (!city.trim()) return routes;
  const matched = routes.filter((r) => cityNamesMatch(r.city, city));
  return matched.length > 0 ? matched : routes;
}
