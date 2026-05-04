import { requestJson } from '../lib/api';
import type {
  UserCreatePayload,
  UserResponse,
  UserUpdatePayload,
} from '../types/user';

export async function listUsers(): Promise<UserResponse[]> {
  return requestJson<UserResponse[]>('/users', { method: 'GET' });
}

export async function getUser(userId: number): Promise<UserResponse> {
  return requestJson<UserResponse>(`/users/${userId}`, { method: 'GET' });
}

export async function createUser(payload: UserCreatePayload): Promise<UserResponse> {
  return requestJson<UserResponse>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  userId: number,
  payload: UserUpdatePayload,
): Promise<UserResponse> {
  return requestJson<UserResponse>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(userId: number): Promise<{ status: string }> {
  return requestJson<{ status: string }>(`/users/${userId}`, {
    method: 'DELETE',
  });
}
