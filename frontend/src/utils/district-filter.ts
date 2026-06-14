/** İlçe adı eşleştirme — Google sonuçlarını semte göre filtrele */

function norm(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

export function addressMatchesDistrict(address: string, district: string): boolean {
  if (!district.trim()) return true;
  const addr = norm(address);
  const d = norm(district);
  if (addr.includes(d) || d.includes(addr)) return true;
  const parts = d.split(/\s+/).filter((p) => p.length >= 3);
  if (parts.length > 0 && parts.every((part) => addr.includes(part))) return true;
  const first = parts[0];
  if (first && first.length >= 4 && addr.includes(first)) return true;
  return false;
}

export function filterGoogleByDistrict<T extends { address?: string; name?: string }>(
  items: T[],
  district: string,
): T[] {
  if (!district.trim()) return items;
  return items.filter(
    (p) => addressMatchesDistrict(p.address ?? '', district) || addressMatchesDistrict(p.name ?? '', district),
  );
}

export function filterGoogleByCity<T extends { address?: string; name?: string }>(
  items: T[],
  city: string,
): T[] {
  if (!city.trim()) return items;
  const c = norm(city);
  return items.filter((p) => {
    const addr = norm(p.address ?? '');
    const name = norm(p.name ?? '');
    return addr.includes(c) || name.includes(c) || c.split(/\s+/).every((part) => part.length >= 3 && addr.includes(part));
  });
}
