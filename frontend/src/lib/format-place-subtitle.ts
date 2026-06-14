import type { PlaceResponse } from '../types/place';

/** Mekan kartları için daha bilgilendirici alt metin. */
export function formatPlaceSubtitle(place: PlaceResponse): string {
  const parts: string[] = [];
  if (place.description?.trim()) {
    parts.push(place.description.trim());
  }
  const loc = [place.district, place.city].filter(Boolean).join(', ');
  if (loc) parts.push(loc);
  if (place.tags?.length) {
    parts.push(place.tags.slice(0, 3).join(' · '));
  }
  return parts.join(' · ') || loc;
}

export function formatGooglePlaceSubtitle(
  address?: string | null,
  rating?: number | null,
  reviewCount?: number | null,
  extra?: string,
): string {
  const parts: string[] = [];
  if (extra?.trim()) parts.push(extra.trim());
  if (rating != null) {
    parts.push(`★ ${rating}${reviewCount ? ` (${reviewCount} yorum)` : ''}`);
  }
  if (address?.trim()) parts.push(address.trim());
  return parts.join(' · ');
}
