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
  return addr.includes(d) || d.split(/\s+/).every((part) => part.length >= 3 && addr.includes(part));
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
