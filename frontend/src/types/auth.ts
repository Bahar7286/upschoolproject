export interface LoginRequestPayload {
  email: string;
  password: string;
}

export interface LoginResponsePayload {
  access_token: string;
  token_type?: string;
}

export interface RegisterRequestPayload {
  full_name: string;
  email: string;
  password: string;
  role?: 'tourist' | 'guide' | 'admin';
}

export interface RegisterResponsePayload extends LoginResponsePayload {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
}
