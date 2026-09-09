import type { Db } from "./db";
import {
  academy,
  catalogs,
  createTemplate,
  deleteTemplate,
  ensureWeek,
  getSession,
  listTemplates,
  mondayOf,
  publicBook,
  selfServeCancel,
  sessionBookings,
  setBookingStatus,
  updateCutoffHours,
  weekSessions,
} from "./db";
import { parseCategory, parseSide } from "./domain/student";
import { CutoffError } from "./domain/cutoff";
import type { BookingStatus, DayOfWeek } from "./domain/types";
import { requireAcademy } from "./auth";
import { configFromEnv as whatsappConfig, notifyReservation } from "./notify/whatsapp";

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

  if (req.method === "GET" && url.pathname === "/api/settings") {
    const ac = await academy(db);
    return json({ name: ac.name, cutoff_hours: ac.cutoff_hours, timezone: ac.timezone, locale: ac.locale });
  }

  if (req.method === "PATCH" && url.pathname === "/api/settings") {
    const denied = await requireAcademy(req);
    if (denied) return denied;
    const body = (await req.json()) as { cutoff_hours?: number | string };
    try {
      const hours = await updateCutoffHours(db, body.cutoff_hours ?? "");
      return json({ cutoff_hours: hours, message: `Plazo: ${hours} h antes de la clase.` });
    } catch (err) {
      const msg = err instanceof CutoffError || err instanceof Error ? err.message : "Error";
      return json({ error: msg }, 400);
    }
  }

  if (req.method === "GET" && url.pathname === "/api/catalog") {
    const cat = await catalogs(db);
    return json({
      locations: cat.locations,
      coaches: cat.coaches,
      students: cat.students,
      courts: cat.courts,
      offerings: cat.offerings,
    });
  }

  if (req.method === "GET" && url.pathname === "/api/templates") {
    const denied = await requireAcademy(req);
    if (denied) return denied;
    return json({ templates: await listTemplates(db) });
  }

  if (req.method === "POST" && url.pathname === "/api/templates") {
    const denied = await requireAcademy(req);
    if (denied) return denied;
    const body = (await req.json()) as {
      offeringId?: string;
      locationId?: string;
      courtId?: string;
      coachId?: string;
      weekday?: DayOfWeek;
      startTime?: string;
    };
    try {
      const id = await createTemplate(db, {
        offeringId: body.offeringId ?? "",
        locationId: body.locationId ?? "",
        courtId: body.courtId ?? "",
        coachId: body.coachId ?? "",
        weekday: body.weekday ?? "monday",
        startTime: body.startTime ?? "",
      });
      return json({ id });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Error" }, 400);
    }
  }

  const delTpl = url.pathname.match(/^\/api\/templates\/([^/]+)$/);
  if (req.method === "DELETE" && delTpl) {
    const denied = await requireAcademy(req);
    if (denied) return denied;
    await deleteTemplate(db, decodeURIComponent(delTpl[1]));
    return json({ ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/week") {
    const raw = url.searchParams.get("monday");
    const monday = mondayOf(raw ? new Date(`${raw}T00:00:00.000Z`) : new Date());
    await ensureWeek(db, monday);
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
      const sessionId = body.sessionId ?? "";
      const status = await publicBook(db, sessionId, body.name ?? "", body.phone ?? "", {
        category: parseCategory(body.category),
        side: parseSide(body.side),
      });
      const session = await getSession(db, sessionId);
      const when = session ? new Date(session.starts_at).toISOString().slice(11, 16) : "";
      const text = session
        ? `Viborea: ${session.offering_name} ${when} · ${session.location_name} · ${session.court_name} · ${session.coach_name}. Reserva ${status}.`
        : `Viborea: reserva ${status}.`;
      const sent = await notifyReservation(whatsappConfig(), body.phone ?? "", text);
      const base = status === "waitlisted" ? "Lista de espera." : "Reserva anotada. Pendiente de pago.";
      const wa = sent.ok && sent.channel !== "dry-run" ? " Te escribimos por WhatsApp." : "";
      return json({ status, message: base + wa, whatsapp: sent.channel, whatsapp_ok: sent.ok });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Error" }, 400);
    }
  }

  const cancelMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)\/cancel$/);
  if (req.method === "POST" && cancelMatch) {
    try {
      await selfServeCancel(db, decodeURIComponent(cancelMatch[1]));
      return json({ message: "Reserva cancelada." });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Error" }, 400);
    }
  }

  const payMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)\/status$/);
  if (req.method === "POST" && payMatch) {
    const denied = await requireAcademy(req);
    if (denied) return denied;
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
