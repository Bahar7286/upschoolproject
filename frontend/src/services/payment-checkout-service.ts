import { requestJson, requestJsonWithAuth } from '../lib/api';

export interface CheckoutStartPayload {
  user_id: number;
  amount: number;
  currency?: string;
  route_id?: number | null;
  offer_id?: number | null;
  trip_request_id?: number | null;
  payment_method?: 'card' | 'wallet';
  card_holder?: string;
  card_last4?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface PurchaseRecord {
  purchase_id: number;
  user_id: number;
  route_id: number;
  amount: number;
  currency: string;
  status: string;
  transaction_ref: string;
  payment_method: string;
  offer_id: number | null;
  trip_request_id: number | null;
}

export interface PaymentConfig {
  stripe_enabled: boolean;
  publishable_key: string | null;
}

export interface StripeCheckoutResult {
  purchase_id: number;
  checkout_url: string;
}

export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  return requestJson<PaymentConfig>('/payments/config');
}

export async function startCheckout(
  accessToken: string,
  payload: CheckoutStartPayload,
): Promise<PurchaseRecord> {
  return requestJsonWithAuth('/payments/checkout', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function startStripeCheckout(
  accessToken: string,
  payload: CheckoutStartPayload,
): Promise<StripeCheckoutResult> {
  return requestJsonWithAuth('/payments/checkout/stripe', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function confirmCheckout(
  accessToken: string,
  purchaseId: number,
  acceptOffer: boolean,
  stripeSessionId?: string,
): Promise<PurchaseRecord> {
  return requestJsonWithAuth('/payments/checkout/confirm', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      purchase_id: purchaseId,
      accept_offer: acceptOffer,
      stripe_session_id: stripeSessionId ?? null,
    }),
  });
}
