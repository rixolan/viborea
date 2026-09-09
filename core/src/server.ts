import {
  OverlapError,
  academyById,
  academyBySlug,
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
  updateCutoffHours,
  updateStudent,
  weekSessions,
} from "./db";
import {
  pickProfePage,
  pickSedePage,
  placeholderBookPage,
  placeholderWeekPage,
  gridPage,
  sessionPage,
  pilotoPage,
  alumnosPage,
  ajustesPage,
} from "./html";
import { PLACEHOLDER_PROFES, PLACEHOLDER_SEDES, findProfe, findSede } from "./placeholders";
import { seedIfEmpty, alignCatalog, DG_ACADEMY_ID } from "./seed";
import { CutoffError } from "./domain/cutoff";
import type { BookingStatus } from "./domain/types";
import { parseCategory, parseSide } from "./domain/student";
import { TpagoClient, configFromEnv, handleTpagoHook } from "./payments/tpago";
import { configFromEnv as whatsappConfig, notifyReservation } from "./notify/whatsapp";
import { pilotoReserva } from "./piloto";
import type { PackAlert } from "./domain/pack";
import { handleApi } from "./api";
import { existsSync } from "node:fs";
import { join } from "node:path";

const DIST = join(import.meta.dir, "../../web/dist");
const db = await openDb();
await seedIfEmpty(db);
await alignCatalog(db);

const PORT = Number(process.env.PORT ?? 3000);
const tpago = new TpagoClient(configFromEnv());
const wa = whatsappConfig();

async function sendPackAlert(phone: string, alert: PackAlert | null) {
  if (!alert) return { ok: true, channel: "dry-run" as const, error: undefined as string | undefined };
  return notifyReservation(wa, phone, alert.message);
}

async function studentPhone(bookingId: string): Promise<string | null> {
  const [row] = await db`SELECT s.phone AS phone FROM bookings b JOIN students s ON s.id = b.student_id WHERE b.id = ${bookingId}`;
  return row ? String(row.phone) : null;
}

function parseWeek(url: URL): { monday: Date; day: number } {
  const w = url.searchParams.get("week");
  const rawDay = Number(url.searchParams.get("day") ?? "0");
  const day = Number.isFinite(rawDay) ? Math.min(6, Math.max(0, rawDay)) : 0;
  const monday = mondayOf(w ? new Date(`${w}T00:00:00.000Z`) : new Date());
  return { monday, day };
}

function redirect(path: string, flash?: { ok?: string; error?: string }): Response {
  const u = new URL(path, "http://viborea.local");
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
  hostname: "0.0.0.0",
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname === "/hooks/tpago") {
      return handleTpagoHook(req);
    }
    const { monday, day } = parseWeek(url);
    const apiRes = await handleApi(req, db);
    if (apiRes) return apiRes;
    if (existsSync(DIST) && req.method === "GET" && url.pathname !== "/piloto") {
      const rel = url.pathname.replace(/^\//, "");
      if (rel.includes(".")) {
        const asset = Bun.file(join(DIST, rel));
        if (await asset.exists()) return new Response(asset);
      }
      return new Response(Bun.file(join(DIST, "index.html")), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    const ac = (await academyBySlug(db, "academiadg")) ?? (await academyById(db, DG_ACADEMY_ID));
    const aid = ac.id;
    await ensureWeek(db, aid, monday);
    const flash = flashOf(url);
    if (req.method === "GET" && url.pathname === "/piloto") {
      return html(pilotoPage(ac, flash));
    }
    if (req.method === "POST" && url.pathname === "/piloto/reserva") {
      const type = req.headers.get("content-type") ?? "";
      let name = "";
      let phone = "";
      let category = "beginner";
      let side = "";
      if (type.includes("application/json")) {
        const body = (await req.json()) as { name?: string; phone?: string; category?: string; side?: string };
        name = body.name ?? "";
        phone = body.phone ?? "";
        category = body.category ?? "beginner";
        side = body.side ?? "";
      } else {
        const form = await readForm(req);
        name = form.get("name") ?? "";
        phone = form.get("phone") ?? "";
        category = form.get("category") ?? "beginner";
        side = form.get("side") ?? "";
      }
      try {
        const result = await pilotoReserva(db, {
          name,
          phone,
          category: parseCategory(category),
          side: parseSide(side),
        });
        const sent = await sendPackAlert(phone, result.alert);
        const whatsapp = sent.ok
          ? sent.channel === "dry-run"
            ? "dry-run (faltan WHATSAPP_TEST_*)"
            : sent.channel === "template"
              ? `enviado hello_world (${sent.error ?? "sin texto libre"})`
              : "texto enviado"
          : `falló: ${sent.error ?? "error"}`;
        if (type.includes("application/json")) {
          return Response.json({
            ...result,
            whatsapp,
            whatsappOk: sent.ok,
            whatsappChannel: sent.channel,
          });
        }
        return html(
          pilotoPage(ac, { ok: result.alert.message }, {
            offering: result.offering,
            startsAt: result.startsAt,
            remaining: result.remaining,
            message: result.alert.message,
            whatsapp,
          }),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error";
        if (type.includes("application/json")) {
          return Response.json({ error: msg }, { status: 400 });
        }
        return html(pilotoPage(ac, { error: msg }));
      }
    }
    if (req.method === "GET" && url.pathname === "/alumnos") {
      const cat = await catalogs(db, aid);
      return html(alumnosPage(ac, cat.students, flash));
    }
    if (req.method === "POST" && url.pathname === "/alumnos") {
      const form = await readForm(req);
      try {
        await updateStudent(db, aid, form.get("id") ?? "", {
          name: form.get("name") ?? undefined,
          category: parseCategory(form.get("category")),
          side: parseSide(form.get("side")),
        });
        return redirect("/alumnos", { ok: "Alumno actualizado." });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error";
        return redirect("/alumnos", { error: msg });
      }
    }
    if (req.method === "GET" && url.pathname === "/ajustes") {
      return html(ajustesPage(ac, flash));
    }
    if (req.method === "POST" && url.pathname === "/ajustes") {
      const form = await readForm(req);
      try {
        const hours = await updateCutoffHours(db, aid, form.get("cutoff_hours") ?? "");
        return redirect("/ajustes", { ok: `Plazo: ${hours} h antes de la clase.` });
      } catch (err) {
        const msg = err instanceof CutoffError || err instanceof Error ? err.message : "Error";
        return redirect("/ajustes", { error: msg });
      }
    }
    if (req.method === "GET" && url.pathname === "/") {
      const cat = await catalogs(db, aid);
      return html(
        gridPage({
          academy: ac,
          monday,
          dayOffset: day,
          sessions: await weekSessions(db, aid, monday),
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
        const link = await tpago.createLink({
          amount: 150_000,
          currency: "PYG",
          bookingId: crypto.randomUUID(),
          description: `Individual ${profe.name} · ${sede.name}`,
        });
        return redirect(`/reservar/${sede.id}/${profe.id}?week=${encodeURIComponent(w)}`, {
          ok: `Pendiente de pago. ${link.url}`,
        });
      }
    }

    const sessionMatch = url.pathname.match(/^\/sesiones\/([^/]+)$/);
    if (req.method === "GET" && sessionMatch) {
      const row = await getSession(db, aid, decodeURIComponent(sessionMatch[1]));
      if (!row) return new Response("No encontrada", { status: 404 });
      const cat = await catalogs(db, aid);
      return html(
        sessionPage({
          academy: ac,
          session: row,
          bookings: await sessionBookings(db, aid, row.id),
          students: cat.students,
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
        await createSession(db, aid, {
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
      await cancelSession(db, aid, decodeURIComponent(cancelMatch[1]));
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
        const status = await bookStudent(db, aid, id, form.get("student_id") ?? "");
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
      const bookingId = decodeURIComponent(payMatch[1]);
      const status = (form.get("status") ?? "confirmed") as BookingStatus;
      const alert = await setBookingStatus(db, aid, bookingId, status);
      const week = form.get("week") ?? "";
      const d = form.get("day") ?? "0";
      const [booking] = await db`SELECT session_id FROM bookings WHERE id = ${bookingId}`;
      const sid = booking ? String(booking.session_id) : "";
      const phone = await studentPhone(bookingId);
      if (phone) await sendPackAlert(phone, alert);
      const ok =
        alert?.message ??
        (status === "confirmed" ? "Marcado pagado." : "Marcado pendiente.");
      return redirect(`/sesiones/${sid}?week=${encodeURIComponent(week)}&day=${encodeURIComponent(d)}`, { ok });
    }

    return new Response("No encontrada", { status: 404 });
  },
});

console.log(`Viborea http://localhost:${PORT}`);
