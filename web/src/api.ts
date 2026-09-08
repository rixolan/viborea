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

export const api = {
  catalog: () => req<{ locations: Location[]; coaches: Coach[]; students: Student[] }>("/api/catalog"),
  week: (monday: string) => req<{ sessions: Session[] }>(`/api/week?monday=${monday}`),
  session: (id: string) => req<SessionDetail>(`/api/sessions/${id}`),
  book: (input: { sessionId: string; name: string; phone: string; category?: string; side?: string }) =>
    req<{ status: string; message?: string }>("/api/book", { method: "POST", body: JSON.stringify(input) }),
  setStatus: (bookingId: string, status: string) =>
    req<{ message: string }>(`/api/bookings/${bookingId}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
};
