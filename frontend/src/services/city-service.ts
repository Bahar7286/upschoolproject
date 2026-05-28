import { requestJson } from '../lib/api';

import type { CityResponse, DistrictResponse } from '../types/city';

export async function listCities(): Promise<CityResponse[]> {
  return requestJson<CityResponse[]>('/cities');
}

export async function listDistrictsByCity(cityId: number): Promise<DistrictResponse[]> {
  return requestJson<DistrictResponse[]>(`/cities/${cityId}/districts`);
}

