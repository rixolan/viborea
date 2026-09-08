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

describe("sqlite + solape", () => {
  it("rechaza una clase que pisa cancha de la planilla madre", () => {
    const db = openDb(":memory:");
    seedIfEmpty(db);
    const monday = new Date("2026-09-07T00:00:00.000Z");
    ensureWeek(db, monday);
    const week = weekSessions(db, monday);
    expect(week.length).toBeGreaterThan(0);

    expect(() =>
      createSession(db, {
        offeringId: "off-individual",
        courtId: "court-costanera-1",
        coachId: "teacher-sofia",
        startsAt: new Date("2026-09-07T15:00:00.000Z"),
        dayWindow: { from: monday, to: addDays(monday, 7) },
      }),
    ).toThrow(OverlapError);
  });
});

describe("reserva pública", () => {
  it("anota por nombre y teléfono y rechaza clase llena", () => {
    const db = openDb(":memory:");
    seedIfEmpty(db);
    const monday = addDays(mondayOf(new Date()), 7);
    ensureWeek(db, monday);
    const row = weekSessions(db, monday).find((s) => s.capacity === 1 && s.cancelled === 0);
    expect(row).toBeTruthy();
    expect(publicBook(db, row!.id, "Ana Pérez", "0981111111")).toBe("pending_payment");
    expect(() => publicBook(db, row!.id, "Otra Persona", "0982222222")).toThrow("Clase completa");
  });
});

describe("paquete de 10", () => {
  it("al confirmar la reserva consume 1 clase y deja el aviso", () => {
    const db = openDb(":memory:");
    seedIfEmpty(db);
    const monday = addDays(mondayOf(new Date()), 7);
    ensureWeek(db, monday);
    const row = weekSessions(db, monday).find((s) => s.capacity === 4 && s.cancelled === 0);
    expect(row).toBeTruthy();
    expect(publicBook(db, row!.id, "Ana Pérez", "0981111111")).toBe("pending_payment");
    const student = db.query("SELECT id FROM students WHERE phone = ?").get("0981111111") as { id: string };
    buyPack(db, student.id, "group", 10);
    const booking = db
      .query("SELECT id FROM bookings WHERE session_id = ? AND student_id = ?")
      .get(row!.id, student.id) as { id: string };
    const alert = setBookingStatus(db, booking.id, "confirmed");
    expect(alert?.remaining).toBe(9);
    expect(alert?.buyAgain).toBe(false);
    expect(alert?.message).toContain("Te quedan 9");
    expect(activePack(db, student.id, "group")?.remaining).toBe(9);
    expect(studentAlerts(db, student.id)[0]?.message).toContain("Te quedan 9");
    expect(setBookingStatus(db, booking.id, "confirmed")).toBeNull();
    expect(activePack(db, student.id, "group")?.remaining).toBe(9);
  });
});
