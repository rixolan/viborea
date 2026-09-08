import type { Db } from "./db";
import {
  academy,
  catalogs,
  getSession,
  mondayOf,
  publicBook,
  sessionBookings,
  setBookingStatus,
  weekSessions,
} from "./db";
import { parseCategory, parseSide } from "./domain/student";
import type { BookingStatus } from "./domain/types";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function handleApi(req: Request, db: Db): Promise<Response | null> {
  const url = new URL(req.url);
  if (!url.pathname.startsWith("/api/")) return null;

  if (req.method === "GET" && url.pathname === "/api/health") {
    const ac = await academy(db);
    return json({ ok: true, academy: ac.name });
  }

  if (req.method === "GET" && url.pathname === "/api/catalog") {
    const cat = await catalogs(db);
    return json({ locations: cat.locations, coaches: cat.coaches, students: cat.students });
  }

  if (req.method === "GET" && url.pathname === "/api/week") {
    const raw = url.searchParams.get("monday");
    const monday = mondayOf(raw ? new Date(`${raw}T00:00:00.000Z`) : new Date());
    const sessions = await weekSessions(db, monday);
    return json({ monday: monday.toISOString().slice(0, 10), sessions });
  }

  const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (req.method === "GET" && sessionMatch) {
    const session = await getSession(db, decodeURIComponent(sessionMatch[1]));
    if (!session) return json({ error: "Sesión inexistente" }, 404);
    const bookings = await sessionBookings(db, session.id);
    return json({ session, bookings });
  }

  if (req.method === "POST" && url.pathname === "/api/book") {
    const body = (await req.json()) as {
      sessionId?: string;
      name?: string;
      phone?: string;
      category?: string;
      side?: string;
    };
    try {
      const status = await publicBook(db, body.sessionId ?? "", body.name ?? "", body.phone ?? "", {
        category: parseCategory(body.category),
        side: parseSide(body.side),
      });
      return json({ status, message: status === "waitlisted" ? "Lista de espera." : "Reserva pendiente de pago." });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Error" }, 400);
    }
  }

  const payMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)\/status$/);
  if (req.method === "POST" && payMatch) {
    const body = (await req.json()) as { status?: BookingStatus };
    try {
      const alert = await setBookingStatus(db, decodeURIComponent(payMatch[1]), body.status ?? "confirmed");
      return json({ message: alert?.message ?? "Actualizado." });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Error" }, 400);
    }
  }

  return json({ error: "No encontrada" }, 404);
}
