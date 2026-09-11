import type { Db } from "./db";
import {
  academyBySlug,
  bookerRedirectSlug,
  catalogs,
  ClaimedFichaError,
  createTemplate,
  deleteTemplate,
  ensureWeek,
  getSession,
  identifyPlayer,
  listTemplates,
  manageBooking,
  mondayOf,
  publicBook,
  selfServeCancel,
  selfServeReschedule,
  sessionBookings,
  setBookingStatus,
  studentHistory,
  updateCutoffHours,
  weekGrid,
  weekSessions,
  type Academy,
  type Student,
} from "./db";
import { parseCategory, parseSide } from "./domain/student";
import { CutoffError } from "./domain/cutoff";
import type { BookingStatus, DayOfWeek } from "./domain/types";
import { readClerk, requireAcademy } from "./auth";
import { configFromEnv as whatsappConfig, notifyReservation } from "./notify/whatsapp";
import { cookieName, decodePlayerCookie, readCookie, setPlayerCookieHeader } from "./player-cookie";
import { decodeManageToken, manageUrl } from "./manage-link";

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers });
}

function staff(gate: { academy: Academy } | Response): gate is { academy: Academy } {
  return !(gate instanceof Response);
}

const bookerRe = /^\/api\/a\/([^/]+)(?:\/(.*))?$/;

async function playerOf(req: Request, db: Db, academy: Academy) {
  const clerk = await readClerk(req);
  const raw = readCookie(req.headers.get("cookie"), cookieName(academy.slug));
  const cookieStudentId = decodePlayerCookie(academy.id, raw);
  return identifyPlayer(db, academy.id, {
    clerkUserId: clerk?.userId ?? null,
    cookieStudentId,
    claimCookie: Boolean(clerk?.userId),
  });
}

export async function handleApi(req: Request, db: Db): Promise<Response | null> {
  const url = new URL(req.url);
  if (!url.pathname.startsWith("/api/")) return null;

  if (req.method === "GET" && url.pathname === "/api/health") {
    return json({ ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/booker") {
    return json({ slug: await bookerRedirectSlug(db) });
  }

  const booker = url.pathname.match(bookerRe);
  if (booker) {
    const slug = decodeURIComponent(booker[1]);
    const rest = booker[2] ?? "";
    const ac = await academyBySlug(db, slug);
    if (!ac) return json({ error: "Academia inexistente" }, 404);
    return handleBooker(req, db, url, ac, rest);
  }

  const denied = await requireAcademy(req, db);
  if (!staff(denied)) return denied;
  const academy = denied.academy;
  return handleStaff(req, db, url, academy);
}

async function handleBooker(req: Request, db: Db, url: URL, ac: Academy, rest: string): Promise<Response> {
  if (req.method === "GET" && rest === "catalog") {
    const cat = await catalogs(db, ac.id);
    return json({
      name: ac.name,
      slug: ac.slug,
      locations: cat.locations,
      coaches: cat.coaches,
      courts: cat.courts,
      offerings: cat.offerings,
    });
  }

  if (req.method === "GET" && rest === "week") {
    const raw = url.searchParams.get("monday");
    const monday = mondayOf(raw ? new Date(`${raw}T00:00:00.000Z`) : new Date());
    await ensureWeek(db, ac.id, monday);
    const sessions = await weekGrid(db, ac.id, monday);
    return json({ monday: monday.toISOString().slice(0, 10), sessions, name: ac.name, slug: ac.slug });
  }

  const sessionMatch = rest.match(/^sessions\/([^/]+)$/);
  if (req.method === "GET" && sessionMatch) {
    const session = await getSession(db, ac.id, decodeURIComponent(sessionMatch[1]));
    if (!session) return json({ error: "Sesión inexistente" }, 404);
    return json({ session });
  }

  if (req.method === "GET" && rest === "me") {
    const student = await playerOf(req, db, ac);
    if (!student) {
      return json({ student: null, bookings: [] });
    }
    return json({ student, bookings: await studentHistory(db, ac.id, student.id) });
  }

  if (req.method === "POST" && rest === "book") {
    const body = (await req.json()) as {
      sessionId?: string;
      name?: string;
      phone?: string;
      category?: string;
      side?: string;
      offeringId?: string;
    };
    try {
      const clerk = await readClerk(req);
      const raw = readCookie(req.headers.get("cookie"), cookieName(ac.slug));
      const cookieStudentId = decodePlayerCookie(ac.id, raw);
      const sessionId = body.sessionId ?? "";
      const { status, student, bookingId } = await publicBook(db, ac.id, sessionId, body.name ?? "", body.phone ?? "", {
        category: parseCategory(body.category),
        side: parseSide(body.side),
        clerkUserId: clerk?.userId ?? null,
        cookieStudentId,
        offeringId: body.offeringId ?? null,
      });
      const session = await getSession(db, ac.id, sessionId);
      const when = session ? new Date(session.starts_at).toISOString().slice(11, 16) : "";
      const link = bookingId ? manageUrl(ac.slug, ac.id, bookingId) : "";
      const text = session
        ? `Viborea: ${session.offering_name} ${when} · ${session.location_name} · ${session.coach_name}. Reserva ${status}.${link ? ` Gestioná: ${link}` : ""}`
        : `Viborea: reserva ${status}.${link ? ` Gestioná: ${link}` : ""}`;
      const sent = await notifyReservation(whatsappConfig(), student.phone, text);
      const base = status === "waitlisted" ? "Lista de espera." : "Reserva anotada. Pendiente de pago.";
      const wa = sent.ok && sent.channel !== "dry-run" ? " Te escribimos por WhatsApp." : "";
      return json(
        { status, message: base + wa, whatsapp: sent.channel, whatsapp_ok: sent.ok, manage_url: link || undefined },
        200,
        { "Set-Cookie": setPlayerCookieHeader(ac.slug, ac.id, student.id) },
      );
    } catch (err) {
      const code = err instanceof ClaimedFichaError ? 409 : 400;
      return json({ error: err instanceof Error ? err.message : "Error" }, code);
    }
  }

  const manageGet = rest.match(/^manage\/([^/]+)$/);
  if (req.method === "GET" && manageGet) {
    const bookingId = decodeManageToken(ac.id, decodeURIComponent(manageGet[1]));
    if (!bookingId) return json({ error: "Enlace inválido" }, 404);
    const booking = await manageBooking(db, ac.id, bookingId);
    if (!booking) return json({ error: "Reserva inexistente" }, 404);
    const monday = mondayOf(new Date(booking.starts_at));
    const alternatives = booking.can_change
      ? (await weekGrid(db, ac.id, monday)).filter(
          (s) => s.id !== booking.session_id && s.cancelled === 0 && s.booked < s.capacity,
        )
      : [];
    return json({ booking, alternatives });
  }

  const manageCancel = rest.match(/^manage\/([^/]+)\/cancel$/);
  if (req.method === "POST" && manageCancel) {
    const bookingId = decodeManageToken(ac.id, decodeURIComponent(manageCancel[1]));
    if (!bookingId) return json({ error: "Enlace inválido" }, 404);
    const booking = await manageBooking(db, ac.id, bookingId);
    if (!booking) return json({ error: "Reserva inexistente" }, 404);
    try {
      await selfServeCancel(db, ac.id, bookingId, booking.student_id);
      return json({ message: "Reserva cancelada." });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Error" }, 400);
    }
  }

  const manageMove = rest.match(/^manage\/([^/]+)\/reschedule$/);
  if (req.method === "POST" && manageMove) {
    const bookingId = decodeManageToken(ac.id, decodeURIComponent(manageMove[1]));
    if (!bookingId) return json({ error: "Enlace inválido" }, 404);
    const booking = await manageBooking(db, ac.id, bookingId);
    if (!booking) return json({ error: "Reserva inexistente" }, 404);
    const body = (await req.json()) as { sessionId?: string; offeringId?: string };
    try {
      const moved = await selfServeReschedule(db, ac.id, bookingId, booking.student_id, body.sessionId ?? "", body.offeringId);
      return json({ message: "Reprogramada.", sessionId: moved.sessionId, status: moved.status });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Error" }, 400);
    }
  }

  const cancelMatch = rest.match(/^bookings\/([^/]+)\/cancel$/);
  if (req.method === "POST" && cancelMatch) {
    const student = await playerOf(req, db, ac);
    if (!student) return json({ error: "Entrá para cancelar." }, 401);
    try {
      await selfServeCancel(db, ac.id, decodeURIComponent(cancelMatch[1]), student.id);
      return json({ message: "Reserva cancelada." });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Error" }, 400);
    }
  }

  return json({ error: "No encontrada" }, 404);
}

async function handleStaff(req: Request, db: Db, url: URL, academy: Academy): Promise<Response> {
  if (req.method === "GET" && url.pathname === "/api/settings") {
    return json({
      name: academy.name,
      slug: academy.slug,
      cutoff_hours: academy.cutoff_hours,
      timezone: academy.timezone,
      locale: academy.locale,
      booker_path: `/reservar/${academy.slug}`,
    });
  }

  if (req.method === "PATCH" && url.pathname === "/api/settings") {
    const body = (await req.json()) as { cutoff_hours?: number | string };
    try {
      const hours = await updateCutoffHours(db, academy.id, body.cutoff_hours ?? "");
      return json({ cutoff_hours: hours, message: `Plazo: ${hours} h antes de la clase.` });
    } catch (err) {
      const msg = err instanceof CutoffError || err instanceof Error ? err.message : "Error";
      return json({ error: msg }, 400);
    }
  }

  if (req.method === "GET" && url.pathname === "/api/catalog") {
    const cat = await catalogs(db, academy.id);
    return json({
      locations: cat.locations,
      coaches: cat.coaches,
      students: cat.students,
      courts: cat.courts,
      offerings: cat.offerings,
    });
  }

  if (req.method === "GET" && url.pathname === "/api/templates") {
    return json({ templates: await listTemplates(db, academy.id) });
  }

  if (req.method === "POST" && url.pathname === "/api/templates") {
    const body = (await req.json()) as {
      offeringId?: string;
      locationId?: string;
      courtId?: string;
      coachId?: string;
      weekday?: DayOfWeek;
      startTime?: string;
    };
    try {
      const id = await createTemplate(db, academy.id, {
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
    await deleteTemplate(db, academy.id, decodeURIComponent(delTpl[1]));
    return json({ ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/week") {
    const raw = url.searchParams.get("monday");
    const monday = mondayOf(raw ? new Date(`${raw}T00:00:00.000Z`) : new Date());
    await ensureWeek(db, academy.id, monday);
    const sessions = await weekSessions(db, academy.id, monday);
    return json({ monday: monday.toISOString().slice(0, 10), sessions });
  }

  const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (req.method === "GET" && sessionMatch) {
    const session = await getSession(db, academy.id, decodeURIComponent(sessionMatch[1]));
    if (!session) return json({ error: "Sesión inexistente" }, 404);
    const bookings = await sessionBookings(db, academy.id, session.id);
    return json({ session, bookings });
  }

  const payMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)\/status$/);
  if (req.method === "POST" && payMatch) {
    const body = (await req.json()) as { status?: BookingStatus };
    try {
      const alert = await setBookingStatus(db, academy.id, decodeURIComponent(payMatch[1]), body.status ?? "confirmed");
      return json({ message: alert?.message ?? "Actualizado." });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Error" }, 400);
    }
  }

  return json({ error: "No encontrada" }, 404);
}
