export type Session = {
  id: string;
  offering_id?: string;
  offering_name: string;
  location_id: string;
  location_name: string;
  court_name: string;
  coach_id: string;
  coach_name: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  source?: string;
};

export type Location = {
  id: string;
  name: string;
  address?: string | null;
  maps_url?: string | null;
  image_url?: string | null;
};
export type Coach = { id: string; name: string };
export type Court = { id: string; location_id: string; name: string; number: number };
export type Offering = { id: string; name: string; duration_minutes: number; capacity: number; price: number };
export type Student = {
  id: string;
  name: string;
  phone: string;
  category: string;
  side: string | null;
};
export type Booking = {
  id: string;
  student_name: string;
  status: string;
  category: string;
  side: string | null;
};
export type HistoryBooking = {
  id: string;
  session_id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  offering_name: string;
  coach_name: string;
  location_name: string;
  court_name: string;
};
export type Template = {
  id: string;
  offering_id: string;
  offering_name: string;
  location_id: string;
  location_name: string;
  court_id: string;
  court_name: string;
  coach_id: string;
  coach_name: string;
  weekday: string;
  start_time: string;
  end_time: string;
};

export type SessionDetail = { session: Session; bookings: Booking[] };

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

export type AcademySettings = {
  name: string;
  slug: string;
  cutoff_hours: number;
  timezone: string;
  locale: string;
  booker_path: string;
};

function auth(token?: string): HeadersInit {
  return token ? { authorization: `Bearer ${token}` } : {};
}

export const api = {
  bookerHome: () => req<{ slug: string | null }>("/api/booker"),
  bookerCatalog: (slug: string) =>
    req<{ name: string; slug: string; locations: Location[]; coaches: Coach[]; courts: Court[]; offerings: Offering[] }>(
      `/api/a/${slug}/catalog`,
    ),
  bookerWeek: (slug: string, monday: string) =>
    req<{ sessions: Session[]; name: string }>(`/api/a/${slug}/week?monday=${monday}`),
  bookerSession: (slug: string, id: string) =>
    req<{ session: Session }>(`/api/a/${slug}/sessions/${encodeURIComponent(id)}`),
  bookerMe: (slug: string, token?: string) =>
    req<{ student: Student | null; bookings: HistoryBooking[] }>(`/api/a/${slug}/me`, { headers: auth(token) }),
  catalog: (token?: string) =>
    req<{ locations: Location[]; coaches: Coach[]; students: Student[]; courts: Court[]; offerings: Offering[] }>(
      "/api/catalog",
      { headers: auth(token) },
    ),
  week: (monday: string, token?: string) =>
    req<{ sessions: Session[] }>(`/api/week?monday=${monday}`, { headers: auth(token) }),
  session: (id: string, token?: string) => req<SessionDetail>(`/api/sessions/${id}`, { headers: auth(token) }),
  settings: (token?: string) => req<AcademySettings>("/api/settings", { headers: auth(token) }),
  saveSettings: (cutoffHours: number, token?: string) =>
    req<{ cutoff_hours: number; message: string }>("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ cutoff_hours: cutoffHours }),
      headers: auth(token),
    }),
  templates: (token?: string) => req<{ templates: Template[] }>("/api/templates", { headers: auth(token) }),
  addTemplate: (
    input: { offeringId: string; locationId: string; courtId: string; coachId: string; weekday: string; startTime: string },
    token?: string,
  ) => req<{ id: string }>("/api/templates", { method: "POST", body: JSON.stringify(input), headers: auth(token) }),
  deleteTemplate: (id: string, token?: string) =>
    req<{ ok: boolean }>(`/api/templates/${id}`, { method: "DELETE", headers: auth(token) }),
  book: (slug: string, input: { sessionId: string; name: string; phone: string; offeringId?: string }, token?: string) =>
    req<{ status: string; message?: string; whatsapp?: string; whatsapp_ok?: boolean; manage_url?: string }>(`/api/a/${slug}/book`, {
      method: "POST",
      body: JSON.stringify(input),
      headers: auth(token),
    }),
  manage: (slug: string, token: string) =>
    req<{
      booking: HistoryBooking & { student_id: string; can_change: boolean };
      alternatives: Session[];
    }>(`/api/a/${slug}/manage/${encodeURIComponent(token)}`),
  manageCancel: (slug: string, token: string) =>
    req<{ message: string }>(`/api/a/${slug}/manage/${encodeURIComponent(token)}/cancel`, { method: "POST", body: "{}" }),
  manageReschedule: (slug: string, token: string, sessionId: string, offeringId?: string) =>
    req<{ message: string; sessionId: string }>(`/api/a/${slug}/manage/${encodeURIComponent(token)}/reschedule`, {
      method: "POST",
      body: JSON.stringify({ sessionId, offeringId }),
    }),
  setStatus: (bookingId: string, status: string, token?: string) =>
    req<{ message: string }>(`/api/bookings/${bookingId}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
      headers: auth(token),
    }),
};
