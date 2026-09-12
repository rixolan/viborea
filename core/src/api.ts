import type { Db } from "./db";
import {
  academyBySlug,
  bookerRedirectSlug,
  cancelSession,
  catalogs,
  ClaimedFichaError,
  createAvailability,
  createCoach,
  createCourt,
  createLocation,
  createOffering,
  createSession,
  createTemplate,
  deleteAvailability,
  deleteCoach,
  deleteCourt,
  deleteLocation,
  deleteOffering,
  deleteTemplate,
  ensureWeek,
  getSession,
  identifyPlayer,
  listAvailability,
  listTemplates,
  manageBooking,
  publicBook,
  selfServeCancel,
  selfServeReschedule,
  sessionBookings,
  setBookingStatus,
  manageBookingByToken,
  studentHistory,
  updateAcademySettings,
  updateCoach,
  updateLocation,
  updateOffering,
  updateStudent,
  weekGrid,
  weekOfAcademy,
  weekSessions,
  type Academy,
  type CancelledSession,
} from "./db";
import { parseCategory, parseSide } from "./domain/student";
import { CutoffError } from "./domain/cutoff";
import { OverlapError, type BookingStatus, type DayOfWeek } from "./domain/types";
import { instantFrom, parseTimeOfDay } from "./domain/timezone";
import { readClerk, requireAcademy } from "./auth";
import { configFromEnv as whatsappConfig, notifyReservation } from "./notify/whatsapp";
import { cookieName, legacyStudentId, readCookie, setPlayerCookieHeader } from "./player-cookie";
import { legacyBookingId, manageUrl, publicOrigin } from "./manage-link";
import { RateLimiter, clientIp } from "./ratelimit";

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers });
}

function staff(gate: { academy: Academy } | Response): gate is { academy: Academy } {
  return !(gate instanceof Response);
}

/**
 * Bad input is a 400 carrying the domain's own Spanish message. Anything else
 * — a Postgres error, a bug — is logged and answered generically: a player
 * mid-booking should never read a SQL error.
 */
function failed(err: unknown): Response {
  if (err instanceof ClaimedFichaError) return json({ error: err.message }, 409);
  if (err instanceof OverlapError) {
    const kind =
      err.conflicts[0]?.kind === "coach"
        ? "El profe ya tiene clase a esa hora"
        : "La cancha ya está ocupada a esa hora";
    return json({ error: kind }, 409);
  }
  if (err instanceof CutoffError || err instanceof RangeError) return json({ error: err.message }, 400);
  const pgCode = (err as { code?: unknown } | null)?.code;
  if (pgCode !== undefined || err instanceof TypeError || !(err instanceof Error)) {
    console.error("api", err);
    return json({ error: "No se pudo completar la operación. Probá de nuevo." }, 500);
  }
  return json({ error: err.message }, 400);
}

/** A malformed body is the client's problem, not a 500. */
async function body<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new RangeError("JSON inválido");
  }
}

// Two tiers, because a mobile carrier in Paraguay puts many players behind one
// address: ATTEMPTS caps pure hammering and is never refunded; BOOKINGS caps
// how many cupos one address can actually take and is refunded when the
// booking is refused.
const BOOK_ATTEMPTS = new RateLimiter(40, 10 * 60_000);
const BOOK_LIMIT = new RateLimiter(12, 10 * 60_000);
const MANAGE_LIMIT = new RateLimiter(30, 10 * 60_000);

const bookerRe = /^\/api\/a\/([^/]+)(?:\/(.*))?$/;

/** The cookie is a row token now; the signed three-part form is still read. */
function playerCookie(academy: Academy, req: Request): { cookieToken: string | null; cookieStudentId: string | null } {
  const raw = readCookie(req.headers.get("cookie"), cookieName(academy.slug));
  if (!raw) return { cookieToken: null, cookieStudentId: null };
  const legacy = legacyStudentId(academy.id, raw);
  return legacy ? { cookieToken: null, cookieStudentId: legacy } : { cookieToken: raw, cookieStudentId: null };
}

/** Resolve a manage link: a row token, or an HMAC link sent before them. */
async function bookingFromLink(db: Db, academy: Academy, token: string) {
  const byToken = await manageBookingByToken(db, academy.id, token);
  if (byToken) return byToken;
  const legacy = legacyBookingId(academy.id, token);
  return legacy ? manageBooking(db, academy.id, legacy) : null;
}

async function playerOf(req: Request, db: Db, academy: Academy) {
  const clerk = await readClerk(req);
  return identifyPlayer(db, academy.id, {
    clerkUserId: clerk?.userId ?? null,
    ...playerCookie(academy, req),
    claimCookie: Boolean(clerk?.userId),
  });
}

export async function handleApi(req: Request, db: Db): Promise<Response | null> {
  const url = new URL(req.url);
  if (!url.pathname.startsWith("/api/")) return null;

  if (req.method === "GET" && url.pathname === "/api/health") {
    // Liveness that means something: the process is up *and* Postgres answers.
    try {
      await db`SELECT 1`;
      return json({ ok: true });
    } catch (err) {
      console.error("health", err);
      return json({ ok: false, error: "db" }, 503);
    }
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
    try {
      return await handleBooker(req, db, url, ac, rest);
    } catch (err) {
      return failed(err);
    }
  }

  const denied = await requireAcademy(req, db);
  if (!staff(denied)) return denied;
  try {
    return await handleStaff(req, db, url, denied.academy);
  } catch (err) {
    return failed(err);
  }
}

/** `monday=YYYY-MM-DD` is a local calendar date, not an instant. */
function weekRef(url: URL): string | Date {
  const raw = url.searchParams.get("monday");
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date();
}

async function handleBooker(req: Request, db: Db, url: URL, ac: Academy, rest: string): Promise<Response> {
  if (req.method === "GET" && rest === "catalog") {
    const cat = await catalogs(db, ac.id);
    return json({
      name: ac.name,
      slug: ac.slug,
      timezone: ac.timezone,
      currency: ac.currency,
      cutoff_hours: ac.cutoff_hours,
      locations: cat.locations,
      coaches: cat.coaches,
      courts: cat.courts,
      offerings: cat.offerings,
    });
  }

  if (req.method === "GET" && rest === "week") {
    const win = await ensureWeek(db, ac.id, weekRef(url));
    const sessions = await weekGrid(db, ac.id, win.mondayKey);
    return json({
      monday: win.mondayKey,
      timezone: win.timeZone,
      sessions,
      name: ac.name,
      slug: ac.slug,
    });
  }

  const sessionMatch = rest.match(/^sessions\/([^/]+)$/);
  if (req.method === "GET" && sessionMatch) {
    const session = await getSession(db, ac.id, decodeURIComponent(sessionMatch[1]));
    if (!session) return json({ error: "Sesión inexistente" }, 404);
    return json({ session, timezone: ac.timezone });
  }

  if (req.method === "GET" && rest === "me") {
    const student = await playerOf(req, db, ac);
    if (!student) {
      return json({ student: null, bookings: [], timezone: ac.timezone });
    }
    return json({ student, bookings: await studentHistory(db, ac.id, student.id), timezone: ac.timezone });
  }

  if (req.method === "POST" && rest === "book") {
    const ip = clientIp(req);
    for (const gate of [BOOK_ATTEMPTS.check(`try:${ip}`), BOOK_LIMIT.check(`book:${ip}`)]) {
      if (!gate.ok) {
        return json({ error: "Demasiados intentos. Probá en unos minutos." }, 429, {
          "Retry-After": String(gate.retryAfterSeconds),
        });
      }
    }
    const input = await body<{
      sessionId?: string;
      name?: string;
      phone?: string;
      category?: string;
      side?: string;
      offeringId?: string;
    }>(req);
    try {
      const clerk = await readClerk(req);
      const sessionId = input.sessionId ?? "";
      const { status, student, manageToken } = await publicBook(db, ac.id, sessionId, input.name ?? "", input.phone ?? "", {
        category: parseCategory(input.category),
        side: parseSide(input.side),
        clerkUserId: clerk?.userId ?? null,
        ...playerCookie(ac, req),
        offeringId: input.offeringId ?? null,
      });
      const session = await getSession(db, ac.id, sessionId);
      const when = session ? `${session.local_date} ${session.local_time}` : "";
      const link = manageToken ? manageUrl(ac.slug, manageToken) : "";
      const text = session
        ? `Viborea: ${session.offering_name} ${when} · ${session.location_name} · ${session.coach_name}. Reserva ${status}.${link ? ` Gestioná: ${link}` : ""}`
        : `Viborea: reserva ${status}.${link ? ` Gestioná: ${link}` : ""}`;
      const sent = await notifyReservation(whatsappConfig(), student.phone, text);
      const base = status === "waitlisted" ? "Lista de espera." : "Reserva anotada. Pendiente de pago.";
      const wa = sent.ok && sent.channel !== "dry-run" ? " Te escribimos por WhatsApp." : "";
      return json(
        { status, message: base + wa, whatsapp: sent.channel, whatsapp_ok: sent.ok, manage_url: link || undefined },
        200,
        { "Set-Cookie": setPlayerCookieHeader(ac.slug, student.cookie_token) },
      );
    } catch (err) {
      // A refused booking should not spend the caller's budget.
      BOOK_LIMIT.release(`book:${ip}`);
      throw err;
    }
  }

  const manageGet = rest.match(/^manage\/([^/]+)$/);
  if (req.method === "GET" && manageGet) {
    const gate = MANAGE_LIMIT.check(`manage:${clientIp(req)}`);
    if (!gate.ok) {
      return json({ error: "Demasiados intentos." }, 429, { "Retry-After": String(gate.retryAfterSeconds) });
    }
    const booking = await bookingFromLink(db, ac, decodeURIComponent(manageGet[1]));
    if (!booking) return json({ error: "Enlace inválido" }, 404);
    const win = weekOfAcademy(ac, new Date(booking.starts_at));
    const alternatives = booking.can_change
      ? (await weekGrid(db, ac.id, win.mondayKey)).filter(
          (s) => s.id !== booking.session_id && s.cancelled === 0 && s.booked < s.capacity,
        )
      : [];
    return json({ booking, alternatives, timezone: ac.timezone });
  }

  const manageCancel = rest.match(/^manage\/([^/]+)\/cancel$/);
  if (req.method === "POST" && manageCancel) {
    const booking = await bookingFromLink(db, ac, decodeURIComponent(manageCancel[1]));
    if (!booking) return json({ error: "Enlace inválido" }, 404);
    await selfServeCancel(db, ac.id, booking.id, booking.student_id);
    return json({ message: "Reserva cancelada." });
  }

  const manageMove = rest.match(/^manage\/([^/]+)\/reschedule$/);
  if (req.method === "POST" && manageMove) {
    const booking = await bookingFromLink(db, ac, decodeURIComponent(manageMove[1]));
    if (!booking) return json({ error: "Enlace inválido" }, 404);
    const input = await body<{ sessionId?: string; offeringId?: string }>(req);
    const moved = await selfServeReschedule(
      db,
      ac.id,
      booking.id,
      booking.student_id,
      input.sessionId ?? "",
      input.offeringId,
    );
    return json({ message: "Reprogramada.", sessionId: moved.sessionId, status: moved.status });
  }

  const cancelMatch = rest.match(/^bookings\/([^/]+)\/cancel$/);
  if (req.method === "POST" && cancelMatch) {
    const student = await playerOf(req, db, ac);
    if (!student) return json({ error: "Entrá para cancelar." }, 401);
    await selfServeCancel(db, ac.id, decodeURIComponent(cancelMatch[1]), student.id);
    return json({ message: "Reserva cancelada." });
  }

  return json({ error: "No encontrada" }, 404);
}

function settingsOf(academy: Academy) {
  return {
    name: academy.name,
    slug: academy.slug,
    cutoff_hours: academy.cutoff_hours,
    hold_minutes: academy.hold_minutes,
    timezone: academy.timezone,
    locale: academy.locale,
    currency: academy.currency,
    booker_path: `/reservar/${academy.slug}`,
  };
}

/** WhatsApp to everyone whose class the academia just called off. */
async function notifyCancellation(academy: Academy, cancelled: CancelledSession): Promise<number> {
  const cfg = whatsappConfig();
  const when = `${cancelled.session.local_date} ${cancelled.session.local_time}`;
  let sent = 0;
  for (const person of cancelled.affected) {
    const text = `Viborea: ${academy.name} canceló la clase de ${when} (${cancelled.session.offering_name}, ${cancelled.session.coach_name}). Si era de un paquete, te devolvimos la clase. Reservá otro horario: ${publicOrigin()}/reservar/${academy.slug}`;
    const result = await notifyReservation(cfg, person.phone, text);
    if (result.ok && result.channel !== "dry-run") sent += 1;
  }
  return sent;
}

async function handleStaff(req: Request, db: Db, url: URL, academy: Academy): Promise<Response> {
  if (req.method === "GET" && url.pathname === "/api/settings") {
    return json(settingsOf(academy));
  }

  if (req.method === "PATCH" && url.pathname === "/api/settings") {
    const input = await body<{
      cutoff_hours?: number | string;
      hold_minutes?: number | string;
      name?: string;
      timezone?: string;
      currency?: string;
    }>(req);
    const next = await updateAcademySettings(db, academy.id, input);
    return json({ ...settingsOf(next), message: "Ajustes guardados." });
  }

  if (req.method === "GET" && url.pathname === "/api/catalog") {
    const cat = await catalogs(db, academy.id);
    return json({
      locations: cat.locations,
      coaches: cat.coaches,
      students: cat.students,
      courts: cat.courts,
      offerings: cat.offerings,
      timezone: academy.timezone,
    });
  }

  if (url.pathname === "/api/availability") {
    if (req.method === "GET") {
      return json({ availability: await listAvailability(db, academy.id) });
    }
    if (req.method === "POST") {
      const input = await body<{
        coachId?: string;
        locationId?: string;
        weekday?: string;
        startTime?: string;
        endTime?: string;
      }>(req);
      const id = await createAvailability(db, academy.id, {
        coachId: input.coachId ?? "",
        locationId: input.locationId ?? "",
        weekday: input.weekday ?? "",
        startTime: input.startTime ?? "",
        endTime: input.endTime ?? "",
      });
      return json({ id, availability: await listAvailability(db, academy.id) });
    }
  }

  const availabilityId = url.pathname.match(/^\/api\/availability\/([^/]+)$/);
  if (req.method === "DELETE" && availabilityId) {
    await deleteAvailability(db, academy.id, decodeURIComponent(availabilityId[1]));
    return json({ availability: await listAvailability(db, academy.id) });
  }

  if (url.pathname === "/api/locations" && req.method === "POST") {
    const input = await body<{ name?: string; address?: string; mapsUrl?: string; imageUrl?: string }>(req);
    const id = await createLocation(db, academy.id, {
      name: input.name ?? "",
      address: input.address,
      mapsUrl: input.mapsUrl,
      imageUrl: input.imageUrl,
    });
    return json({ id });
  }

  const locationId = url.pathname.match(/^\/api\/locations\/([^/]+)$/);
  if (locationId) {
    const id = decodeURIComponent(locationId[1]);
    if (req.method === "PATCH") {
      const input = await body<{ name?: string; address?: string; mapsUrl?: string; imageUrl?: string }>(req);
      await updateLocation(db, academy.id, id, {
        name: input.name,
        address: input.address,
        mapsUrl: input.mapsUrl,
        imageUrl: input.imageUrl,
      });
      return json({ ok: true });
    }
    if (req.method === "DELETE") {
      await deleteLocation(db, academy.id, id);
      return json({ ok: true });
    }
  }

  if (url.pathname === "/api/courts" && req.method === "POST") {
    const input = await body<{ locationId?: string; name?: string; number?: number | string }>(req);
    const id = await createCourt(db, academy.id, {
      locationId: input.locationId ?? "",
      name: input.name ?? "",
      number: input.number,
    });
    return json({ id });
  }

  const courtId = url.pathname.match(/^\/api\/courts\/([^/]+)$/);
  if (req.method === "DELETE" && courtId) {
    await deleteCourt(db, academy.id, decodeURIComponent(courtId[1]));
    return json({ ok: true });
  }

  if (url.pathname === "/api/coaches" && req.method === "POST") {
    const input = await body<{ name?: string; bio?: string; languages?: string[] | string }>(req);
    const id = await createCoach(db, academy.id, {
      name: input.name ?? "",
      bio: input.bio,
      languages: input.languages,
    });
    return json({ id });
  }

  const coachId = url.pathname.match(/^\/api\/coaches\/([^/]+)$/);
  if (coachId) {
    const id = decodeURIComponent(coachId[1]);
    if (req.method === "PATCH") {
      const input = await body<{ name?: string; bio?: string; languages?: string[] | string }>(req);
      await updateCoach(db, academy.id, id, { name: input.name, bio: input.bio, languages: input.languages });
      return json({ ok: true });
    }
    if (req.method === "DELETE") {
      await deleteCoach(db, academy.id, id);
      return json({ ok: true });
    }
  }

  if (url.pathname === "/api/offerings" && req.method === "POST") {
    const input = await body<{ name?: string; durationMinutes?: number; capacity?: number; price?: number }>(req);
    const id = await createOffering(db, academy.id, {
      name: input.name ?? "",
      durationMinutes: input.durationMinutes,
      capacity: input.capacity,
      price: input.price,
    });
    return json({ id });
  }

  const offeringId = url.pathname.match(/^\/api\/offerings\/([^/]+)$/);
  if (offeringId) {
    const id = decodeURIComponent(offeringId[1]);
    if (req.method === "PATCH") {
      const input = await body<{ name?: string; durationMinutes?: number; capacity?: number; price?: number }>(req);
      await updateOffering(db, academy.id, id, {
        name: input.name,
        durationMinutes: input.durationMinutes,
        capacity: input.capacity,
        price: input.price,
      });
      return json({ ok: true });
    }
    if (req.method === "DELETE") {
      await deleteOffering(db, academy.id, id);
      return json({ ok: true });
    }
  }

  const studentId = url.pathname.match(/^\/api\/students\/([^/]+)$/);
  if (req.method === "PATCH" && studentId) {
    const input = await body<{ name?: string; category?: string; side?: string }>(req);
    await updateStudent(db, academy.id, decodeURIComponent(studentId[1]), {
      name: input.name,
      category: parseCategory(input.category),
      side: parseSide(input.side),
    });
    return json({ ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/templates") {
    return json({ templates: await listTemplates(db, academy.id) });
  }

  if (req.method === "POST" && url.pathname === "/api/templates") {
    const input = await body<{
      offeringId?: string;
      locationId?: string;
      courtId?: string;
      coachId?: string;
      weekday?: DayOfWeek;
      startTime?: string;
    }>(req);
    const id = await createTemplate(db, academy.id, {
      offeringId: input.offeringId ?? "",
      locationId: input.locationId ?? "",
      courtId: input.courtId ?? "",
      coachId: input.coachId ?? "",
      weekday: input.weekday ?? "monday",
      startTime: input.startTime ?? "",
    });
    return json({ id });
  }

  const delTpl = url.pathname.match(/^\/api\/templates\/([^/]+)$/);
  if (req.method === "DELETE" && delTpl) {
    await deleteTemplate(db, academy.id, decodeURIComponent(delTpl[1]));
    return json({ ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/week") {
    const win = await ensureWeek(db, academy.id, weekRef(url));
    const sessions = await weekSessions(db, academy.id, win.mondayKey);
    return json({ monday: win.mondayKey, timezone: win.timeZone, sessions });
  }

  if (req.method === "POST" && url.pathname === "/api/sessions") {
    const input = await body<{
      offeringId?: string;
      courtId?: string;
      coachId?: string;
      date?: string;
      startTime?: string;
    }>(req);
    if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new RangeError("Fecha inválida. Usá YYYY-MM-DD.");
    const startsAt = instantFrom(input.date, parseTimeOfDay(input.startTime ?? ""), academy.timezone);
    const id = await createSession(db, academy.id, {
      offeringId: input.offeringId ?? "",
      courtId: input.courtId ?? "",
      coachId: input.coachId ?? "",
      startsAt,
    });
    return json({ id, message: "Clase creada." });
  }

  const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (req.method === "GET" && sessionMatch) {
    const session = await getSession(db, academy.id, decodeURIComponent(sessionMatch[1]));
    if (!session) return json({ error: "Sesión inexistente" }, 404);
    const bookings = await sessionBookings(db, academy.id, session.id);
    return json({ session, bookings, timezone: academy.timezone });
  }

  const cancelSessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/cancel$/);
  if (req.method === "POST" && cancelSessionMatch) {
    const cancelled = await cancelSession(db, academy.id, decodeURIComponent(cancelSessionMatch[1]));
    if (!cancelled) return json({ error: "Sesión inexistente o ya cancelada" }, 404);
    const notified = await notifyCancellation(academy, cancelled);
    const people = cancelled.affected.length;
    return json({
      message:
        people === 0
          ? "Clase cancelada. La planilla madre no cambia."
          : `Clase cancelada. ${people} reserva(s) cancelada(s)${notified ? `, ${notified} aviso(s) por WhatsApp` : ""}.`,
      cancelled: people,
      notified,
    });
  }

  const payMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)\/status$/);
  if (req.method === "POST" && payMatch) {
    const input = await body<{ status?: BookingStatus }>(req);
    const alert = await setBookingStatus(db, academy.id, decodeURIComponent(payMatch[1]), input.status ?? "confirmed");
    return json({ message: alert?.message ?? "Actualizado.", alert: alert ?? undefined });
  }

  return json({ error: "No encontrada" }, 404);
}
