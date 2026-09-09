import { describe, expect, it } from "bun:test";
import { OverlapError } from "./domain/types";
import {
  academyById,
  activePack,
  addDays,
  bookStudent,
  buyPack,
  ClaimedFichaError,
  createSession,
  ensureWeek,
  findOrCreateStudent,
  identifyPlayer,
  mondayOf,
  openDb,
  publicBook,
  setBookingStatus,
  studentAlerts,
  updateCutoffHours,
  weekSessions,
} from "./db";
import { DG_ACADEMY_ID, seedIfEmpty, WP_ACADEMY_ID } from "./seed";

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("postgres + solape", () => {
  it("rechaza una clase que pisa cancha de la planilla madre", async () => {
    const db = await openDb(url);
    await seedIfEmpty(db);
    const monday = new Date("2026-09-07T00:00:00.000Z");
    await ensureWeek(db, DG_ACADEMY_ID, monday);
    const week = await weekSessions(db, DG_ACADEMY_ID, monday);
    expect(week.length).toBeGreaterThan(0);

    await expect(
      createSession(db, DG_ACADEMY_ID, {
        offeringId: "off-individual",
        courtId: "court-costanera-1",
        coachId: "teacher-sofia",
        startsAt: new Date("2026-09-07T15:00:00.000Z"),
        dayWindow: { from: monday, to: addDays(monday, 7) },
      }),
    ).rejects.toBeInstanceOf(OverlapError);
    await db.end();
  });
});
describe.skipIf(!url)("reserva pública", () => {
  it("anota por nombre y teléfono y rechaza clase llena", async () => {
    const db = await openDb(url);
    await seedIfEmpty(db);
    const monday = addDays(mondayOf(new Date()), 7);
    await ensureWeek(db, DG_ACADEMY_ID, monday);
    let session = (await weekSessions(db, DG_ACADEMY_ID, monday)).find(
      (s) => s.capacity === 1 && s.cancelled === 0 && s.booked < s.capacity,
    );
    const sessionId =
      session?.id ??
      (await createSession(db, DG_ACADEMY_ID, {
        offeringId: "off-individual",
        courtId: "court-costanera-1",
        coachId: "teacher-pablo",
        startsAt: new Date(monday.getTime() + 6 * 3600_000),
        dayWindow: { from: monday, to: addDays(monday, 7) },
      }));
    const phone = `+595981${Date.now().toString().slice(-6)}`;
    const { status } = await publicBook(db, DG_ACADEMY_ID, sessionId, "Ana Test", phone, {
      category: "3",
      side: "drive",
    });
    expect(status).toBe("pending_payment");
    await db.end();
  });
});

describe.skipIf(!url)("paquete de 10", () => {
  it("al confirmar la reserva consume 1 clase y deja el aviso", async () => {
    const db = await openDb(url);
    await seedIfEmpty(db);
    const monday = addDays(mondayOf(new Date()), 7);
    await ensureWeek(db, DG_ACADEMY_ID, monday);
    const session = (await weekSessions(db, DG_ACADEMY_ID, monday)).find(
      (s) => s.capacity === 4 && s.cancelled === 0 && s.booked < s.capacity,
    );
    const phone = `+595982${Date.now().toString().slice(-6)}`;
    await publicBook(db, DG_ACADEMY_ID, session!.id, "Pack Test", phone);
    const [student] = await db`SELECT id FROM students WHERE phone = ${phone} AND academy_id = ${DG_ACADEMY_ID}`;
    await buyPack(db, String(student.id), "group", 10);
    const [booking] = await db`SELECT id FROM bookings WHERE session_id = ${session!.id} AND student_id = ${student.id}`;
    const alert = await setBookingStatus(db, DG_ACADEMY_ID, String(booking.id), "confirmed");
    expect(alert?.remaining).toBe(9);
    const pack = await activePack(db, String(student.id), "group");
    expect(pack?.remaining).toBe(9);
    const alerts = await studentAlerts(db, String(student.id));
    expect(alerts.at(-1)?.message).toContain("Te quedan 9");
    await db.end();
  });
});

describe.skipIf(!url)("cutoff por academia", () => {
  it("persiste las horas de plazo", async () => {
    const db = await openDb(url);
    await seedIfEmpty(db);
    expect((await academyById(db, DG_ACADEMY_ID)).cutoff_hours).toBeGreaterThan(0);
    await updateCutoffHours(db, DG_ACADEMY_ID, 24);
    expect((await academyById(db, DG_ACADEMY_ID)).cutoff_hours).toBe(24);
    await updateCutoffHours(db, DG_ACADEMY_ID, 12);
    expect((await academyById(db, DG_ACADEMY_ID)).cutoff_hours).toBe(12);
    await db.end();
  });
});

describe.skipIf(!url)("aislamiento", () => {
  it("el mismo teléfono es dos fichas y la grilla no se mezcla", async () => {
    const db = await openDb(url);
    await seedIfEmpty(db);
    const monday = addDays(mondayOf(new Date()), 7);
    await ensureWeek(db, DG_ACADEMY_ID, monday);
    await ensureWeek(db, WP_ACADEMY_ID, monday);
    const phone = `+595983${Date.now().toString().slice(-6)}`;
    const a = await findOrCreateStudent(db, DG_ACADEMY_ID, "Ana", phone);
    const b = await findOrCreateStudent(db, WP_ACADEMY_ID, "Ana WP", phone);
    expect(a.id).not.toBe(b.id);
    const dg = await weekSessions(db, DG_ACADEMY_ID, monday);
    const wp = await weekSessions(db, WP_ACADEMY_ID, monday);
    expect(wp.every((s) => s.id.startsWith("occ-tpl-wp"))).toBe(true);
    expect(dg.some((s) => s.id.startsWith("occ-tpl-wp"))).toBe(false);
    await db.end();
  });

  it("guest queda bloqueado si la ficha está ligada; staff no", async () => {
    const db = await openDb(url);
    await seedIfEmpty(db);
    const monday = addDays(mondayOf(new Date()), 7);
    await ensureWeek(db, DG_ACADEMY_ID, monday);
    const session = (await weekSessions(db, DG_ACADEMY_ID, monday)).find(
      (s) => s.cancelled === 0 && s.booked < s.capacity,
    );
    const phone = `+595984${Date.now().toString().slice(-6)}`;
    const student = await findOrCreateStudent(db, DG_ACADEMY_ID, "Clara", phone, {
      clerkUserId: `user_claimed_${Date.now()}`,
    });
    await expect(publicBook(db, DG_ACADEMY_ID, session!.id, "Clara", phone)).rejects.toBeInstanceOf(ClaimedFichaError);
    const status = await bookStudent(db, DG_ACADEMY_ID, session!.id, student.id, "admin");
    expect(status).toBe("pending_payment");
    await db.end();
  });

  it("Clerk no hereda la cookie de otro jugador", async () => {
    const db = await openDb(url);
    await seedIfEmpty(db);
    const guest = await findOrCreateStudent(db, DG_ACADEMY_ID, "Alejandro", `+595981${Date.now().toString().slice(-6)}`);
    expect(await identifyPlayer(db, DG_ACADEMY_ID, { clerkUserId: "user_admin", cookieStudentId: guest.id })).toBeNull();
    expect((await identifyPlayer(db, DG_ACADEMY_ID, { cookieStudentId: guest.id }))?.id).toBe(guest.id);
    const clerkId = `user_player_iso_${Date.now()}`;
    const player = await findOrCreateStudent(db, DG_ACADEMY_ID, "Ana", `+595985${Date.now().toString().slice(-6)}`, {
      clerkUserId: clerkId,
    });
    expect((await identifyPlayer(db, DG_ACADEMY_ID, { clerkUserId: clerkId, cookieStudentId: guest.id }))?.id).toBe(
      player.id,
    );
    await db.end();
  });
});
