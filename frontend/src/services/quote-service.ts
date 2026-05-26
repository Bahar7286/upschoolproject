import { requestJsonWithAuth } from '../lib/api';

export interface Quote {
  quote_id: number;
  tourist_id: number;
  tourist_name: string;
  guide_id: number;
  guide_name: string;
  route_id: number | null;
  route_title: string | null;
  group_size: number;
  preferred_date: string;
  preferred_language: string;
  message: string;
  status: string;
  guide_reply: string;
  quoted_total: number | null;
  quoted_per_person: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteCreatePayload {
  guide_id: number;
  route_id?: number | null;
  group_size: number;
  preferred_date: string;
  preferred_language: string;
  message: string;
}

export interface QuoteRespondPayload {
  guide_reply: string;
  quoted_total: number;
  status: 'quoted' | 'declined';
}

export async function createQuote(accessToken: string, payload: QuoteCreatePayload): Promise<Quote> {
  return requestJsonWithAuth('/quotes', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listSentQuotes(accessToken: string): Promise<Quote[]> {
  return requestJsonWithAuth('/quotes/sent', accessToken);
}

export async function listInboxQuotes(accessToken: string): Promise<Quote[]> {
  return requestJsonWithAuth('/quotes/inbox', accessToken);
}

export async function respondToQuote(
  accessToken: string,
  quoteId: number,
  payload: QuoteRespondPayload,
): Promise<Quote> {
  return requestJsonWithAuth(`/quotes/${quoteId}/respond`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
