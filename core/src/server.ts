import {
  OverlapError,
  academy,
  addDays,
  bookStudent,
  cancelSession,
  catalogs,
  createSession,
  ensureWeek,
  getSession,
  mondayOf,
  openDb,
  sessionBookings,
  setBookingStatus,
  weekSessions,
} from "./db";
import { pickProfePage, pickSedePage, placeholderBookPage, placeholderWeekPage, gridPage, sessionPage } from "./html";
import { PLACEHOLDER_PROFES, PLACEHOLDER_SEDES, findProfe, findSede } from "./placeholders";
import { seedIfEmpty } from "./seed";
import type { BookingStatus } from "./domain/types";

const db = openDb();
seedIfEmpty(db);

const PORT = Number(process.env.PORT ?? 3000);

function parseWeek(url: URL): { monday: Date; day: number } {
  const w = url.searchParams.get("week");
  const rawDay = Number(url.searchParams.get("day") ?? "0");
  const day = Number.isFinite(rawDay) ? Math.min(6, Math.max(0, rawDay)) : 0;
  const monday = mondayOf(w ? new Date(`${w}T00:00:00.000Z`) : new Date());
  return { monday, day };
}

function redirect(path: string, flash?: { ok?: string; error?: string }): Response {
  const u = new URL(path, "http://bandeja.local");
  if (flash?.ok) u.searchParams.set("ok", flash.ok);
  if (flash?.error) u.searchParams.set("error", flash.error);
  return new Response(null, { status: 303, headers: { Location: `${u.pathname}${u.search}` } });
}

function flashOf(url: URL): { ok?: string; error?: string } {
  return {
    ok: url.searchParams.get("ok") ?? undefined,
    error: url.searchParams.get("error") ?? undefined,
  };
}

function html(body: string): Response {
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });
}

async function readForm(req: Request): Promise<URLSearchParams> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/x-www-form-urlencoded")) {
    return new URLSearchParams(await req.text());
  }
  const fd = await req.formData();
  const params = new URLSearchParams();
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") params.set(k, v);
  }
  return params;
}

function weekQuery(form: URLSearchParams): string {
  const week = form.get("week") ?? "";
  const day = form.get("day") ?? "0";
  return `/?week=${encodeURIComponent(week)}&day=${encodeURIComponent(day)}`;
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const { monday, day } = parseWeek(url);
    ensureWeek(db, monday);
    const ac = academy(db);
    const flash = flashOf(url);

    if (req.method === "GET" && url.pathname === "/") {
      const cat = catalogs(db);
      return html(
        gridPage({
          academy: ac,
          monday,
          dayOffset: day,
          sessions: weekSessions(db, monday),
          ...cat,
          flash,
        }),
      );
    }

    if (req.method === "GET" && url.pathname === "/reservar") {
      return html(pickSedePage(ac, PLACEHOLDER_SEDES, flash));
    }

    const sedeOnly = url.pathname.match(/^\/reservar\/([^/]+)$/);
    if (req.method === "GET" && sedeOnly) {
      const sede = findSede(decodeURIComponent(sedeOnly[1]));
      if (!sede) return new Response("Sede no encontrada", { status: 404 });
      return html(pickProfePage(ac, sede, PLACEHOLDER_PROFES, flash));
    }

    const sedeProfe = url.pathname.match(/^\/reservar\/([^/]+)\/([^/]+)$/);
    if (req.method === "GET" && sedeProfe) {
      const sede = findSede(decodeURIComponent(sedeProfe[1]));
      const profe = findProfe(decodeURIComponent(sedeProfe[2]));
      if (!sede || !profe) return new Response("No encontrada", { status: 404 });
      return html(placeholderWeekPage({ academy: ac, sede, profe, monday, flash }));
    }

    const horaPath = url.pathname.match(/^\/reservar\/([^/]+)\/([^/]+)\/hora$/);
    if (horaPath) {
      const sede = findSede(decodeURIComponent(horaPath[1]));
      const profe = findProfe(decodeURIComponent(horaPath[2]));
      if (!sede || !profe) return new Response("No encontrada", { status: 404 });
      const week = url.searchParams.get("week") ?? monday.toISOString().slice(0, 10);
      if (req.method === "GET") {
        const dia = Number(url.searchParams.get("dia") ?? "0");
        const hora = url.searchParams.get("hora") ?? "15:00";
        return html(placeholderBookPage({ academy: ac, sede, profe, week, dia, hora, flash }));
      }
      if (req.method === "POST") {
        const form = await readForm(req);
        const w = form.get("week") ?? week;
        return redirect(`/reservar/${sede.id}/${profe.id}?week=${encodeURIComponent(w)}`, {
          ok: "Placeholder: reserva anotada. El pago viene después.",
        });
      }
    }

    const sessionMatch = url.pathname.match(/^\/sesiones\/([^/]+)$/);
    if (req.method === "GET" && sessionMatch) {
      const row = getSession(db, decodeURIComponent(sessionMatch[1]));
      if (!row) return new Response("No encontrada", { status: 404 });
      return html(
        sessionPage({
          academy: ac,
          session: row,
          bookings: sessionBookings(db, row.id),
          students: catalogs(db).students,
          week: url.searchParams.get("week") ?? monday.toISOString().slice(0, 10),
          day,
          flash,
        }),
      );
    }

    if (req.method === "POST" && url.pathname === "/sesiones") {
      const form = await readForm(req);
      const back = weekQuery(form);
      try {
        const week = form.get("week") ?? "";
        const dayOffset = Number(form.get("day") ?? "0");
        const time = form.get("time") ?? "15:00";
        const [h, m] = time.split(":").map(Number);
        const startsAt = addDays(mondayOf(new Date(`${week}T00:00:00.000Z`)), dayOffset);
        startsAt.setUTCHours(h, m, 0, 0);
        const weekStart = mondayOf(startsAt);
        createSession(db, {
          offeringId: form.get("offering_id") ?? "",
          courtId: form.get("court_id") ?? "",
          coachId: form.get("coach_id") ?? "",
          startsAt,
          dayWindow: { from: weekStart, to: addDays(weekStart, 7) },
        });
        return redirect(back, { ok: "Clase creada." });
      } catch (err) {
        const msg =
          err instanceof OverlapError
            ? err.conflicts[0]?.kind === "coach"
              ? "Solape de entrenador"
              : "Solape de cancha"
            : err instanceof Error
              ? err.message
              : "Error";
        return redirect(back, { error: msg });
      }
    }

    const cancelMatch = url.pathname.match(/^\/sesiones\/([^/]+)\/cancelar$/);
    if (req.method === "POST" && cancelMatch) {
      const form = await readForm(req);
      cancelSession(db, decodeURIComponent(cancelMatch[1]));
      return redirect(weekQuery(form), { ok: "Clase cancelada. La planilla madre no cambia." });
    }

    const bookMatch = url.pathname.match(/^\/sesiones\/([^/]+)\/reservar$/);
    if (req.method === "POST" && bookMatch) {
      const form = await readForm(req);
      const id = decodeURIComponent(bookMatch[1]);
      const week = form.get("week") ?? "";
      const d = form.get("day") ?? "0";
      const here = `/sesiones/${id}?week=${encodeURIComponent(week)}&day=${encodeURIComponent(d)}`;
      try {
        const status = bookStudent(db, id, form.get("student_id") ?? "");
        const ok =
          status === "waitlisted" ? "Lista de espera." : "Reserva pendiente de pago.";
        return redirect(here, { ok });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error";
        return redirect(here, { error: msg });
      }
    }

    const payMatch = url.pathname.match(/^\/reservas\/([^/]+)\/estado$/);
    if (req.method === "POST" && payMatch) {
      const form = await readForm(req);
      const status = (form.get("status") ?? "confirmed") as BookingStatus;
      setBookingStatus(db, decodeURIComponent(payMatch[1]), status);
      const week = form.get("week") ?? "";
      const d = form.get("day") ?? "0";
      const booking = db.query("SELECT session_id FROM bookings WHERE id = ?").get(decodeURIComponent(payMatch[1])) as
        | { session_id: string }
        | null;
      const sid = booking?.session_id ?? "";
      return redirect(`/sesiones/${sid}?week=${encodeURIComponent(week)}&day=${encodeURIComponent(d)}`, {
        ok: status === "confirmed" ? "Marcado pagado." : "Marcado pendiente.",
      });
    }

    return new Response("No encontrada", { status: 404 });
  },
});

console.log(`Bandeja http://localhost:${PORT}`);
