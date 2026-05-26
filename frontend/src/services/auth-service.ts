import { requestJson, requestJsonWithAuth } from '../lib/api';
import type {
  LoginRequestPayload,
  LoginResponsePayload,
  RegisterRequestPayload,
  RegisterResponsePayload,
} from '../types/auth';
import type { UserResponse } from '../types/user';

export async function loginUser(
  payload: LoginRequestPayload,
): Promise<LoginResponsePayload> {
  return requestJson<LoginResponsePayload>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function registerUser(
  payload: RegisterRequestPayload,
): Promise<RegisterResponsePayload> {
  return requestJson<RegisterResponsePayload>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCurrentUser(accessToken: string): Promise<UserResponse> {
  return requestJsonWithAuth<UserResponse>('/auth/me', accessToken, {
    method: 'GET',
  });
}

export async function requestPasswordReset(email: string): Promise<{ message: string; reset_url?: string | null }> {
  return requestJson('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordWithToken(
  token: string,
  new_password: string,
): Promise<{ message: string }> {
  return requestJson('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password }),
  });
}
