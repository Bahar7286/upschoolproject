/** Harita merkezi — URL'den koordinat parse ve geçerlilik kontrolü. */

export function parseOptionalCoord(raw: string | null): number | null {
  if (raw == null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function isValidMapCenter(center: { lat: number; lng: number } | null | undefined): boolean {
  if (!center) return false;
  const { lat, lng } = center;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  // (0,0) — Number(null) hatasından veya eksik seed'den gelir
  if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) return false;
  return true;
}
