export interface PurchaseCreatePayload {
  user_id: number;
  route_id: number;
  amount: number;
  currency?: string;
}

export interface PurchaseUpdatePayload {
  amount?: number;
  currency?: string;
  status?: 'pending' | 'confirmed' | 'failed' | 'refunded';
}

export interface PurchaseResponse {
  purchase_id: number;
  user_id: number;
  route_id: number;
  amount: number;
  currency: string;
  status: string;
}
