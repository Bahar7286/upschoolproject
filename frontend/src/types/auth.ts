export interface LoginRequestPayload {
  email: string;
  password: string;
}

export interface LoginResponsePayload {
  access_token: string;
  token_type: string;
}
