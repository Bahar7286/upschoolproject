export interface PlanResponse {
  plan_id: number;
  user_id: number;
  route_id: number | null;
  title: string;
  planned_date: string;
  planned_time: string;
  duration_minutes: number;
  memo: string;
  status: 'planned' | 'completed' | 'cancelled';
  created_at: string;
}

export interface PlanCreatePayload {
  route_id?: number | null;
  title: string;
  planned_date: string;
  planned_time?: string;
  duration_minutes?: number;
  memo?: string;
}

export interface PlanUpdatePayload {
  route_id?: number | null;
  title?: string;
  planned_date?: string;
  planned_time?: string;
  duration_minutes?: number;
  memo?: string;
  status?: 'planned' | 'completed' | 'cancelled';
}
