import { assertNoOverlap } from "./overlap";
import {
  addDaysToKey,
  DEFAULT_TIMEZONE,
  instantFrom,
  keyOfUtc,
  keyToUtc,
  weekdayOfKey,
} from "./timezone";
import { type MaterializedSession, type SessionException, type WeeklyTemplateSlot } from "./types";

/** Local calendar date of a UTC-midnight Date. Week params only. */
export function dateKey(d: Date): string {
  return keyOfUtc(d);
}

/** The instant a local `HH:MM` happens on that local calendar date. */
export function atTimeOn(dateKey: string, time: string, timeZone = DEFAULT_TIMEZONE): Date {
  return instantFrom(dateKey, time, timeZone);
}

function slotActiveOn(slot: WeeklyTemplateSlot, dateKey: string): boolean {
  if (slot.effectiveFrom && dateKey < slot.effectiveFrom) return false;
  if (slot.effectiveUntil && dateKey > slot.effectiveUntil) return false;
  return true;
}

/**
 * Explode the planilla madre into sessions over `[fromKey, toKey)` local days.
 * Times are wall clocks at the sede, so the same 15:00 row is a different
 * instant either side of a DST change.
 */
export function materializeTemplate(
  templates: readonly WeeklyTemplateSlot[],
  range: { fromKey: string; toKey: string; timeZone?: string },
  exceptions: readonly SessionException[] = [],
): MaterializedSession[] {
  const timeZone = range.timeZone ?? DEFAULT_TIMEZONE;
  const sessions: MaterializedSession[] = [];
  for (let key = range.fromKey; key < range.toKey; key = addDaysToKey(key, 1)) {
    const weekday = weekdayOfKey(key);
    for (const slot of templates) {
      if (slot.dayOfWeek !== weekday) continue;
      if (!slotActiveOn(slot, key)) continue;
      const session: MaterializedSession = {
        id: `occ-${slot.id}-${key}`,
        templateId: slot.id,
        offeringId: slot.offeringId,
        locationId: slot.locationId,
        courtId: slot.courtId,
        coachStaffId: slot.coachStaffId,
        startsAt: instantFrom(key, slot.startTime, timeZone),
        endsAt: instantFrom(key, slot.endTime, timeZone),
        capacity: slot.capacity,
        source: "template",
        cancelled: false,
      };
      assertNoOverlap(session, sessions);
      sessions.push(session);
    }
  }
  return applyExceptions(sessions, exceptions);
}

export function applyExceptions(
  sessions: readonly MaterializedSession[],
  exceptions: readonly SessionException[],
): MaterializedSession[] {
  const next = sessions.map((s) => ({ ...s }));
  const byId = new Map(next.map((s) => [s.id, s]));

  for (const ex of exceptions) {
    const row = byId.get(ex.occurrenceId);
    if (!row) continue;
    if (ex.type === "cancel") {
      row.cancelled = true;
      row.source = "exception";
      continue;
    }
    Object.assign(row, ex.patch);
    row.source = "exception";
  }

  return next;
}

/** UTC-midnight Monday of that date. Kept for week parameters, not for times. */
export function mondayOf(d: Date): Date {
  const x = keyToUtc(keyOfUtc(d));
  const day = x.getUTCDay();
  x.setUTCDate(x.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}
