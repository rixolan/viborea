import { describe, expect, it } from "vitest";
import {
  applyExceptions,
  assertNoOverlap,
  canAcceptBooking,
  findOverlaps,
  materializeTemplate,
  remainingCapacity,
  type SessionInterval,
  type WeeklyTemplateSlot,
} from "./index";
import { OverlapError } from "./types";
import { demoWeeklyTemplates } from "@/data/demo/padel-academy";

const monday = new Date("2026-09-07T00:00:00Z"); // Monday

function session(partial: Partial<SessionInterval> & Pick<SessionInterval, "id">): SessionInterval {
  return {
    courtId: "court-1",
    coachStaffId: "coach-1",
    startsAt: new Date("2026-09-07T15:00:00Z"),
    endsAt: new Date("2026-09-07T16:00:00Z"),
    cancelled: false,
    ...partial,
  };
}

const slot = (over: Partial<WeeklyTemplateSlot> = {}): WeeklyTemplateSlot => ({
  id: "tpl-1",
  studioId: "studio-1",
  offeringId: "off-ind",
  locationId: "loc-1",
  courtId: "court-1",
  coachStaffId: "coach-1",
  dayOfWeek: "monday",
  startTime: "15:00",
  endTime: "16:00",
  capacity: 1,
  ...over,
});

describe("solape de pista", () => {
  it("rechaza dos sesiones en la misma pista e intervalo", () => {
    const existing = [session({ id: "a" })];
    const conflicts = findOverlaps(session({ id: "b", coachStaffId: "coach-2" }), existing);
    expect(conflicts).toEqual([
      { kind: "court", sessionId: "b", otherSessionId: "a" },
    ]);
    expect(() => assertNoOverlap(session({ id: "b", coachStaffId: "coach-2" }), existing)).toThrow(
      OverlapError,
    );
  });

  it("permite la misma pista en intervalos adyacentes", () => {
    const existing = [session({ id: "a" })];
    expect(
      findOverlaps(
        session({
          id: "b",
          startsAt: new Date("2026-09-07T16:00:00Z"),
          endsAt: new Date("2026-09-07T17:00:00Z"),
        }),
        existing,
      ),
    ).toEqual([]);
  });
});

describe("solape de profe", () => {
  it("rechaza el mismo entrenador en otra pista a la misma hora", () => {
    const existing = [session({ id: "a" })];
    const conflicts = findOverlaps(session({ id: "b", courtId: "court-2" }), existing);
    expect(conflicts).toEqual([
      { kind: "coach", sessionId: "b", otherSessionId: "a" },
    ]);
  });

  it("permite dos sesiones simultáneas con pista y profe distintos", () => {
    const existing = [session({ id: "a" })];
    expect(
      findOverlaps(session({ id: "b", courtId: "court-2", coachStaffId: "coach-2" }), existing),
    ).toEqual([]);
  });

  it("ignora sesiones canceladas", () => {
    const existing = [session({ id: "a", cancelled: true })];
    expect(findOverlaps(session({ id: "b" }), existing)).toEqual([]);
  });
});

describe("cupo dual / grupal", () => {
  it("dual admite 2 confirmed y rechaza el tercero", () => {
    const bookings = [{ status: "confirmed" as const }, { status: "pending_payment" as const }];
    expect(remainingCapacity(2, bookings)).toBe(0);
    expect(canAcceptBooking(2, bookings)).toBe(false);
  });

  it("grupal N=4 cuenta pending_payment y no cuenta waitlist ni cancelados", () => {
    const bookings = [
      { status: "confirmed" as const },
      { status: "pending_payment" as const },
      { status: "waitlisted" as const },
      { status: "cancelled" as const },
      { status: "checked_in" as const },
    ];
    expect(remainingCapacity(4, bookings)).toBe(1);
    expect(canAcceptBooking(4, bookings)).toBe(true);
  });
});

describe("excepción que no pisa el template", () => {
  it("cancelar una occurrence no muta la planilla madre", () => {
    const templates = [slot()];
    const frozen = structuredClone(templates);
    const from = monday;
    const to = new Date("2026-09-21T00:00:00Z");
    const sessions = materializeTemplate(templates, { from, to });
    expect(sessions.length).toBeGreaterThan(0);

    const firstId = sessions[0].id;
    const after = applyExceptions(sessions, [{ type: "cancel", occurrenceId: firstId }], templates);

    expect(templates).toEqual(frozen);
    expect(after[0].cancelled).toBe(true);
    expect(after[0].source).toBe("exception");
    expect(after.filter((s) => s.templateId === "tpl-1" && !s.cancelled).length).toBe(
      sessions.length - 1,
    );
  });

  it("editar una occurrence deja el resto de semanas con el template original", () => {
    const templates = [slot()];
    const sessions = materializeTemplate(templates, {
      from: monday,
      to: new Date("2026-09-28T00:00:00Z"),
    });
    const first = sessions[0];
    const after = applyExceptions(
      sessions,
      [{ type: "edit", occurrenceId: first.id, patch: { coachStaffId: "coach-sub" } }],
      templates,
    );
    expect(templates[0].coachStaffId).toBe("coach-1");
    expect(after[0].coachStaffId).toBe("coach-sub");
    expect(after[0].source).toBe("exception");
    expect(after.slice(1).every((s) => s.coachStaffId === "coach-1")).toBe(true);
  });
});

describe("semilla de demo", () => {
  it("materializa la planilla madre sin solapes", () => {
    const sessions = materializeTemplate(demoWeeklyTemplates(), {
      from: monday,
      to: new Date("2026-09-14T00:00:00Z"),
    });
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.every((s) => s.courtId && s.coachStaffId)).toBe(true);
  });
});
