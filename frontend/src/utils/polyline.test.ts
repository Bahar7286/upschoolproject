import { describe, expect, it } from 'vitest';

import { decodePolyline } from './polyline';

describe('decodePolyline', () => {
  it('decodes a short encoded path', () => {
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(points.length).toBeGreaterThan(1);
    expect(points[0]).toHaveProperty('lat');
    expect(points[0]).toHaveProperty('lng');
  });
});
