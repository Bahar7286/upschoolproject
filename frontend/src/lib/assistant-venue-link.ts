import { APP_ROUTES } from './routes';
import type { DistrictResponse } from '../types/city';
import type { PlaceResponse } from '../types/place';

function norm(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR');
}

function fold(value: string): string {
  return norm(value)
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export type AssistantVenueLinkContext = {
  cityId?: number;
  cityName: string;
  places: PlaceResponse[];
  districts: DistrictResponse[];
};

/** Asistan önerisindeki mekan adı/adresinden detay sayfası URL'si üret. */
export function resolveAssistantVenueHref(
  title: string,
  address: string,
  ctx: AssistantVenueLinkContext,
): string | null {
  const titleNorm = norm(title);
  const titleFold = fold(title);
  if (!titleNorm) return null;

  for (const place of ctx.places) {
    const placeNorm = norm(place.name);
    const placeFold = fold(place.name);
    const match =
      placeNorm === titleNorm ||
      titleNorm.includes(placeNorm) ||
      placeNorm.includes(titleNorm) ||
      placeFold === titleFold;
    if (match) {
      return APP_ROUTES.dbPlace(place.place_id);
    }
  }

  const addressParts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of addressParts) {
    const district = ctx.districts.find(
      (d) => norm(d.name_tr) === norm(part) || fold(d.name_tr) === fold(part),
    );
    if (!district || !ctx.cityId) continue;

    const districtPlace = ctx.places.find(
      (p) =>
        norm(p.district) === norm(district.name_tr) &&
        (norm(p.name) === titleNorm || titleNorm.includes(norm(p.name))),
    );
    if (districtPlace) {
      return APP_ROUTES.dbPlace(districtPlace.place_id);
    }
    return APP_ROUTES.district(ctx.cityId, district.district_id);
  }

  if (ctx.cityId) {
    const params = new URLSearchParams({ q: title.trim() });
    return `${APP_ROUTES.cityPlaces(ctx.cityId)}?${params.toString()}`;
  }

  const mapParams = new URLSearchParams({ city: ctx.cityName });
  return `${APP_ROUTES.map}?${mapParams.toString()}`;
}
