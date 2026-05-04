/** Backend rotasında koordinat olmadığı için İstanbul merkezinde deterministik yayılım (demo pinleri). */
export function routeMapPosition(routeId: number): { lat: number; lng: number } {
  const baseLat = 41.015137;
  const baseLng = 28.97953;
  const lat = baseLat + (((routeId * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.08;
  const lng = baseLng + (((routeId * 7919 + 23456) % 233280) / 233280 - 0.5) * 0.12;
  return { lat, lng };
}
