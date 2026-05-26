export interface NoteResponse {
  note_id: number;
  user_id: number;
  route_id: number;
  content: string;
  updated_at: string;
}

export interface ReviewResponse {
  review_id: number;
  user_id: number;
  route_id: number;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewSummary {
  average_rating: number;
  review_count: number;
}

export interface ReviewCreatePayload {
  rating: number;
  comment: string;
}
