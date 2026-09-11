export type Session = {
  id: string;
  offering_id?: string;
  offering_name: string;
  location_id: string;
  location_name: string;
  court_id?: string;
  court_name: string;
  coach_id: string;
  coach_name: string;
  starts_at: string;
  ends_at: string;
  /** Wall clock at the sede. Never derive the hour from `starts_at` yourself. */
  local_date: string;
  local_time: string;
  time_zone: string;
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
export type Coach = {
  id: string;
  name: string;
  bio?: string | null;
  languages?: string[];
  location_ids?: string[];
};
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
  local_date: string;
  local_time: string;
  time_zone: string;
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

export type SessionDetail = { session: Session; bookings: Booking[]; timezone: string };

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
  hold_minutes: number;
  timezone: string;
  locale: string;
  currency: string;
  booker_path: string;
};

export type Availability = {
  id: string;
  coach_id: string;
  coach_name: string;
  location_id: string;
  location_name: string;
  weekday: string;
  start_time: string;
  end_time: string;
};

export type BookerCatalog = {
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  cutoff_hours: number;
  locations: Location[];
  coaches: Coach[];
  courts: Court[];
  offerings: Offering[];
};

export type StaffCatalog = {
  locations: Location[];
  coaches: Coach[];
  students: Student[];
  courts: Court[];
  offerings: Offering[];
  timezone: string;
};

export type WeekPayload = { monday: string; timezone: string; sessions: Session[] };

function auth(token?: string): HeadersInit {
  return token ? { authorization: `Bearer ${token}` } : {};
}

export const api = {
  bookerHome: () => req<{ slug: string | null }>("/api/booker"),
  bookerCatalog: (slug: string) => req<BookerCatalog>(`/api/a/${slug}/catalog`),
  bookerWeek: (slug: string, monday: string) =>
    req<WeekPayload & { name: string; slug: string }>(`/api/a/${slug}/week?monday=${monday}`),
  bookerSession: (slug: string, id: string) =>
    req<{ session: Session; timezone: string }>(`/api/a/${slug}/sessions/${encodeURIComponent(id)}`),
  bookerMe: (slug: string, token?: string) =>
    req<{ student: Student | null; bookings: HistoryBooking[]; timezone: string }>(`/api/a/${slug}/me`, {
      headers: auth(token),
    }),
  catalog: (token?: string) => req<StaffCatalog>("/api/catalog", { headers: auth(token) }),
  week: (monday: string, token?: string) => req<WeekPayload>(`/api/week?monday=${monday}`, { headers: auth(token) }),
  session: (id: string, token?: string) =>
    req<SessionDetail>(`/api/sessions/${encodeURIComponent(id)}`, { headers: auth(token) }),
  settings: (token?: string) => req<AcademySettings>("/api/settings", { headers: auth(token) }),
  saveSettings: (
    patch: { cutoff_hours?: number; hold_minutes?: number; name?: string; timezone?: string; currency?: string },
    token?: string,
  ) =>
    req<AcademySettings & { message: string }>("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(patch),
      headers: auth(token),
    }),
  availability: (token?: string) => req<{ availability: Availability[] }>("/api/availability", { headers: auth(token) }),
  addAvailability: (
    input: { coachId: string; locationId: string; weekday: string; startTime: string; endTime: string },
    token?: string,
  ) =>
    req<{ id: string; availability: Availability[] }>("/api/availability", {
      method: "POST",
      body: JSON.stringify(input),
      headers: auth(token),
    }),
  deleteAvailability: (id: string, token?: string) =>
    req<{ availability: Availability[] }>(`/api/availability/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: auth(token),
    }),
  addLocation: (input: { name: string; address?: string; mapsUrl?: string; imageUrl?: string }, token?: string) =>
    req<{ id: string }>("/api/locations", { method: "POST", body: JSON.stringify(input), headers: auth(token) }),
  saveLocation: (
    id: string,
    input: { name?: string; address?: string; mapsUrl?: string; imageUrl?: string },
    token?: string,
  ) =>
    req<{ ok: boolean }>(`/api/locations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: auth(token),
    }),
  deleteLocation: (id: string, token?: string) =>
    req<{ ok: boolean }>(`/api/locations/${encodeURIComponent(id)}`, { method: "DELETE", headers: auth(token) }),
  addCourt: (input: { locationId: string; name: string; number?: number }, token?: string) =>
    req<{ id: string }>("/api/courts", { method: "POST", body: JSON.stringify(input), headers: auth(token) }),
  deleteCourt: (id: string, token?: string) =>
    req<{ ok: boolean }>(`/api/courts/${encodeURIComponent(id)}`, { method: "DELETE", headers: auth(token) }),
  addCoach: (input: { name: string; bio?: string; languages?: string }, token?: string) =>
    req<{ id: string }>("/api/coaches", { method: "POST", body: JSON.stringify(input), headers: auth(token) }),
  saveCoach: (id: string, input: { name?: string; bio?: string; languages?: string }, token?: string) =>
    req<{ ok: boolean }>(`/api/coaches/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: auth(token),
    }),
  deleteCoach: (id: string, token?: string) =>
    req<{ ok: boolean }>(`/api/coaches/${encodeURIComponent(id)}`, { method: "DELETE", headers: auth(token) }),
  addOffering: (input: { name: string; durationMinutes: number; capacity: number; price: number }, token?: string) =>
    req<{ id: string }>("/api/offerings", { method: "POST", body: JSON.stringify(input), headers: auth(token) }),
  saveOffering: (
    id: string,
    input: { name?: string; durationMinutes?: number; capacity?: number; price?: number },
    token?: string,
  ) =>
    req<{ ok: boolean }>(`/api/offerings/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: auth(token),
    }),
  deleteOffering: (id: string, token?: string) =>
    req<{ ok: boolean }>(`/api/offerings/${encodeURIComponent(id)}`, { method: "DELETE", headers: auth(token) }),
  addSession: (
    input: { offeringId: string; courtId: string; coachId: string; date: string; startTime: string },
    token?: string,
  ) => req<{ id: string; message: string }>("/api/sessions", { method: "POST", body: JSON.stringify(input), headers: auth(token) }),
  cancelSession: (id: string, token?: string) =>
    req<{ message: string; cancelled: number; notified: number }>(`/api/sessions/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      body: "{}",
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
      booking: HistoryBooking & { student_id: string; can_change: boolean; offering_id?: string };
      alternatives: Session[];
      timezone: string;
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
