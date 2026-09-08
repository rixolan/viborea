import { describe, expect, it } from "bun:test";
import { OverlapError } from "./domain/types";
import { addDays, createSession, ensureWeek, mondayOf, openDb, publicBook, weekSessions } from "./db";
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
