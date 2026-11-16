import type { OrganizerEventsResponse, OrganizerEvent } from '@/types/event';

// Re-export types so consumers can import from '@/lib/api' directly
export type { OrganizerEvent, OrganizerEventsResponse };

export const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
const API_URL = API;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// The login page or dev scripts can store under either key
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token') || localStorage.getItem('gathr_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) throw new ApiError(401, 'You are not logged in.');
  return { Authorization: `Bearer ${token}` };
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.message ?? 'Request failed');
  return body.data as T;
}

async function apiPut<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.message ?? 'Request failed');
  return body.data as T;
}

// ---------- Organizer dashboard (GTR-41, GTR-42) ----------

export function fetchOrganizerEvents(status?: 'upcoming' | 'past') {
  const qs = status ? `?status=${status}` : '';
  return apiGet<OrganizerEventsResponse>(`/organizer/events${qs}`);
}

// ---------- Edit event (GTR-23, GTR-24) ----------

export function fetchEvent(id: string) {
  return apiGet<OrganizerEvent>(`/events/${id}`);
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  location?: string;
  capacity?: number;
  category?: string;
}

export function updateEvent(id: string, payload: UpdateEventPayload) {
  return apiPut<OrganizerEvent>(`/events/${id}`, payload);
}
