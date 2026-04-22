import type { LoginRequestPayload, LoginResponsePayload } from '../types/auth';

const API_BASE_URL = 'http://127.0.0.1:8000';

export async function loginUser(
  payload: LoginRequestPayload,
): Promise<LoginResponsePayload> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Login failed. Please check your credentials.');
  }

  const data = (await response.json()) as LoginResponsePayload;
  return data;
}
