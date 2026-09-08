import { describe, expect, it } from "bun:test";
import { canAcceptBooking, remainingCapacity } from "./capacity";
import { applyExceptions, materializeTemplate } from "./template";
import { OverlapError, type SessionInterval, type WeeklyTemplateSlot } from "./types";
import { assertNoOverlap, findOverlaps } from "./overlap";

const monday = new Date("2026-09-07T00:00:00Z");

function session(
  partial: Partial<SessionInterval> & Pick<SessionInterval, "id">,
): SessionInterval {
  return {
    courtId: "court-1",
    coachStaffId: "coach-1",
    startsAt: new Date("2026-09-07T15:00:00Z"),
    endsAt: new Date("2026-09-07T16:00:00Z"),
    cancelled: false,
    ...partial,
  };
}

function slot(over: Partial<WeeklyTemplateSlot> = {}): WeeklyTemplateSlot {
  return {
    id: "tpl-1",
    offeringId: "off-ind",
    locationId: "loc-1",
    courtId: "court-1",
    coachStaffId: "coach-1",
    dayOfWeek: "monday",
    startTime: "15:00",
    endTime: "16:00",
    capacity: 1,
    ...over,
  };
}

describe("solape de pista", () => {
  it("rechaza dos sesiones en la misma pista e intervalo", () => {
    const existing = [session({ id: "a" })];
    expect(findOverlaps(session({ id: "b", coachStaffId: "coach-2" }), existing)).toEqual([
      { kind: "court", sessionId: "b", otherSessionId: "a" },
    ]);
    expect(() =>
      assertNoOverlap(session({ id: "b", coachStaffId: "coach-2" }), existing),
    ).toThrow(OverlapError);
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
    expect(findOverlaps(session({ id: "b", courtId: "court-2" }), existing)).toEqual([
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
    expect(findOverlaps(session({ id: "b" }), [session({ id: "a", cancelled: true })])).toEqual([]);
  });
});

describe("cupo dual / grupal", () => {
  it("dual admite 2 occupying y rechaza el tercero", () => {
    const bookings = [{ status: "confirmed" as const }, { status: "pending_payment" as const }];
    expect(remainingCapacity(2, bookings)).toBe(0);
    expect(canAcceptBooking(2, bookings)).toBe(false);
  });

  it("grupal no cuenta waitlist ni cancelados", () => {
    const bookings = [
      { status: "confirmed" as const },
      { status: "pending_payment" as const },
      { status: "waitlisted" as const },
      { status: "cancelled" as const },
      { status: "checked_in" as const },
    ];
    expect(remainingCapacity(4, bookings)).toBe(1);
  });
});

describe("excepción que no pisa el template", () => {
  it("cancelar una occurrence no muta la planilla madre", () => {
    const templates = [slot()];
    const frozen = structuredClone(templates);
    const sessions = materializeTemplate(templates, {
      from: monday,
      to: new Date("2026-09-21T00:00:00Z"),
    });
    const after = applyExceptions(sessions, [{ type: "cancel", occurrenceId: sessions[0].id }]);
    expect(templates).toEqual(frozen);
    expect(after[0].cancelled).toBe(true);
    expect(after[0].source).toBe("exception");
  });

  it("editar una occurrence deja el resto con el template", () => {
    const templates = [slot()];
    const sessions = materializeTemplate(templates, {
      from: monday,
      to: new Date("2026-09-28T00:00:00Z"),
    });
    const after = applyExceptions(sessions, [
      { type: "edit", occurrenceId: sessions[0].id, patch: { coachStaffId: "coach-sub" } },
    ]);
    expect(templates[0].coachStaffId).toBe("coach-1");
    expect(after[0].coachStaffId).toBe("coach-sub");
    expect(after.slice(1).every((s) => s.coachStaffId === "coach-1")).toBe(true);
  });
});
