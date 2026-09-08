import type { DayOfWeek } from "@/types/database";
import { assertNoOverlap } from "./overlap";
import type {
  MaterializedSession,
  SessionException,
  WeeklyTemplateSlot,
} from "./types";

const JS_DAY: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DEFAULT_WINDOW_DAYS = 21;

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function atTimeOn(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const next = new Date(day);
  next.setUTCHours(h, m, 0, 0);
  return next;
}

function slotActiveOn(slot: WeeklyTemplateSlot, day: Date): boolean {
  const key = dateKey(day);
  if (slot.effectiveFrom && key < slot.effectiveFrom) return false;
  if (slot.effectiveUntil && key > slot.effectiveUntil) return false;
  return true;
}

/**
 * Materialize weekly templates into occurrences in [from, to).
 * Default window is 21 days when `to` is omitted.
 * Does not mutate `templates`. Exceptions are applied on a copy of the sessions.
 */
export function materializeTemplate(
  templates: readonly WeeklyTemplateSlot[],
  range: { from: Date; to?: Date },
  exceptions: readonly SessionException[] = [],
): MaterializedSession[] {
  const from = new Date(range.from);
  from.setUTCHours(0, 0, 0, 0);
  const to = range.to
    ? new Date(range.to)
    : new Date(from.getTime() + DEFAULT_WINDOW_DAYS * 86_400_000);

  const sessions: MaterializedSession[] = [];
  const cursor = new Date(from);

  while (cursor < to) {
    const jsDay = cursor.getUTCDay();
    for (const slot of templates) {
      if (JS_DAY[slot.dayOfWeek] !== jsDay) continue;
      if (!slotActiveOn(slot, cursor)) continue;
      const startsAt = atTimeOn(cursor, slot.startTime);
      const endsAt = atTimeOn(cursor, slot.endTime);
      const session: MaterializedSession = {
        id: `occ-${slot.id}-${dateKey(cursor)}`,
        templateId: slot.id,
        offeringId: slot.offeringId,
        locationId: slot.locationId,
        courtId: slot.courtId,
        coachStaffId: slot.coachStaffId,
        startsAt,
        endsAt,
        capacity: slot.capacity,
        source: "template",
        cancelled: false,
      };
      assertNoOverlap(session, sessions);
      sessions.push(session);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return applyExceptions(sessions, exceptions, templates);
}

/**
 * Apply occurrence-level exceptions. `templates` is never mutated.
 * `apply_forward` rewrites later materialized rows that still point at the
 * template; the caller who persists templates must write the rule separately.
 */
export function applyExceptions(
  sessions: readonly MaterializedSession[],
  exceptions: readonly SessionException[],
  templates: readonly WeeklyTemplateSlot[] = [],
): MaterializedSession[] {
  void templates;
  const next = sessions.map((s) => ({ ...s }));
  const byId = new Map(next.map((s) => [s.id, s]));

  for (const ex of exceptions) {
    if (ex.type === "cancel") {
      const row = byId.get(ex.occurrenceId);
      if (!row) continue;
      row.cancelled = true;
      row.source = "exception";
      continue;
    }
    if (ex.type === "edit") {
      const row = byId.get(ex.occurrenceId);
      if (!row) continue;
      Object.assign(row, ex.patch);
      row.source = "exception";
      continue;
    }
    const from = ex.fromDate;
    for (const row of next) {
      if (row.templateId !== ex.templateId) continue;
      if (dateKey(row.startsAt) < from) continue;
      if (ex.patch.courtId) row.courtId = ex.patch.courtId;
      if (ex.patch.coachStaffId) row.coachStaffId = ex.patch.coachStaffId;
      if (ex.patch.capacity !== undefined) row.capacity = ex.patch.capacity;
      if (ex.patch.startTime) {
        row.startsAt = atTimeOn(row.startsAt, ex.patch.startTime);
      }
      if (ex.patch.endTime) {
        row.endsAt = atTimeOn(row.endsAt, ex.patch.endTime);
      }
      row.source = "exception";
    }
  }

  return next;
}
