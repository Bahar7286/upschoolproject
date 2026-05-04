export interface UserCreatePayload {
  full_name: string;
  email: string;
  role?: 'tourist' | 'guide' | 'admin';
}

export interface UserUpdatePayload {
  full_name?: string;
  email?: string;
  role?: 'tourist' | 'guide' | 'admin';
}

export interface UserResponse {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
}
