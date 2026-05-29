import { describe, expect, it } from 'vitest';

import { APP_ROUTES, googlePlaceDetailPath } from './routes';

describe('APP_ROUTES', () => {
  it('uses google-places path for in-app detail (not API path)', () => {
    expect(APP_ROUTES.googlePlace('ChIJabc')).toBe('/google-places/ChIJabc');
    expect(APP_ROUTES.googlePlace('ChIJabc')).not.toContain('/google/places/');
  });

  it('builds district and city paths', () => {
    expect(APP_ROUTES.city(2)).toBe('/cities/2');
    expect(APP_ROUTES.district(2, 1182)).toBe('/cities/2/districts/1182');
  });
});

describe('googlePlaceDetailPath', () => {
  it('appends query params', () => {
    const path = googlePlaceDetailPath('pid1', { back: '/cities/2', cityId: 2 });
    expect(path).toContain('/google-places/pid1');
    expect(path).toContain('back=');
    expect(path).toContain('cityId=2');
  });
});
