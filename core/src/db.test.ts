import { describe, expect, it } from "bun:test";
import { OverlapError } from "./domain/types";
import {
  activePack,
  addDays,
  buyPack,
  createSession,
  ensureWeek,
  mondayOf,
  openDb,
  publicBook,
  setBookingStatus,
  studentAlerts,
  weekSessions,
} from "./db";
import { seedIfEmpty } from "./seed";

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("postgres + solape", () => {
  it("rechaza una clase que pisa cancha de la planilla madre", async () => {
    const db = await openDb(url);
    await seedIfEmpty(db);
    const monday = new Date("2026-09-07T00:00:00.000Z");
    await ensureWeek(db, monday);
    const week = await weekSessions(db, monday);
    expect(week.length).toBeGreaterThan(0);

    await expect(
      createSession(db, {
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
    await ensureWeek(db, monday);
    const session = (await weekSessions(db, monday)).find((s) => s.capacity === 1 && s.cancelled === 0);
    expect(session).toBeTruthy();
    const phone = `+59599${Date.now().toString().slice(-8)}`;
    const status = await publicBook(db, session!.id, "Ana Test", phone, { category: "3", side: "drive" });
    expect(status).toBe("pending_payment");
    await db.end();
  });
});

describe.skipIf(!url)("paquete de 10", () => {
  it("al confirmar la reserva consume 1 clase y deja el aviso", async () => {
    const db = await openDb(url);
    await seedIfEmpty(db);
    const monday = addDays(mondayOf(new Date()), 7);
    await ensureWeek(db, monday);
    const session = (await weekSessions(db, monday)).find((s) => s.capacity === 4 && s.cancelled === 0);
    expect(session).toBeTruthy();
    const phone = `+59598${Date.now().toString().slice(-8)}`;
    await publicBook(db, session!.id, "Pack Test", phone);
    const [student] = await db`SELECT id FROM students WHERE phone = ${phone}`;
    await buyPack(db, String(student.id), "group", 10);
    const [booking] = await db`SELECT id FROM bookings WHERE session_id = ${session!.id} AND student_id = ${student.id}`;
    const alert = await setBookingStatus(db, String(booking.id), "confirmed");
    expect(alert?.remaining).toBe(9);
    const pack = await activePack(db, String(student.id), "group");
    expect(pack?.remaining).toBe(9);
    const alerts = await studentAlerts(db, String(student.id));
    expect(alerts.at(-1)?.message).toContain("Te quedan 9");
    await db.end();
  });
});
