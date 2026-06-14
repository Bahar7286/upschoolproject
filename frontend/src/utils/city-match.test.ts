import { describe, expect, it } from 'vitest';

import { cityNamesMatch, filterRoutesByCity } from './city-match';

describe('cityNamesMatch', () => {
  it('matches Istanbul and İstanbul', () => {
    expect(cityNamesMatch('Istanbul', 'İstanbul')).toBe(true);
    expect(cityNamesMatch('İstanbul', 'Istanbul')).toBe(true);
  });

  it('matches Izmir variants', () => {
    expect(cityNamesMatch('Izmir', 'İzmir')).toBe(true);
  });
});

describe('filterRoutesByCity', () => {
  it('returns Istanbul routes for İstanbul filter', () => {
    const routes = [
      { city: 'Istanbul', route_id: 1 },
      { city: 'Ankara', route_id: 2 },
    ];
    const out = filterRoutesByCity(routes, 'İstanbul');
    expect(out).toHaveLength(1);
    expect(out[0].route_id).toBe(1);
  });
});
