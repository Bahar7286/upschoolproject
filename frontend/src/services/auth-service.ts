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
