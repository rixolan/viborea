export type Session = {
  id: string;
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
};

export type Location = { id: string; name: string };
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
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

export type AcademySettings = { name: string; cutoff_hours: number; timezone: string; locale: string };

function auth(token?: string): HeadersInit {
  return token ? { authorization: `Bearer ${token}` } : {};
}

export const api = {
  catalog: () =>
    req<{ locations: Location[]; coaches: Coach[]; students: Student[]; courts: Court[]; offerings: Offering[] }>(
      "/api/catalog",
    ),
  week: (monday: string) => req<{ sessions: Session[] }>(`/api/week?monday=${monday}`),
  session: (id: string) => req<SessionDetail>(`/api/sessions/${id}`),
  settings: () => req<AcademySettings>("/api/settings"),
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
  book: (input: { sessionId: string; name: string; phone: string; category?: string; side?: string }) =>
    req<{ status: string; message?: string; whatsapp?: string; whatsapp_ok?: boolean }>("/api/book", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  setStatus: (bookingId: string, status: string, token?: string) =>
    req<{ message: string }>(`/api/bookings/${bookingId}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
      headers: auth(token),
    }),
};
