import { assertNoOverlap } from "./overlap";
import {
  JS_DAY,
  type MaterializedSession,
  type SessionException,
  type WeeklyTemplateSlot,
} from "./types";

const DEFAULT_WINDOW_DAYS = 21;

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function atTimeOn(day: Date, hhmm: string): Date {
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
      const session: MaterializedSession = {
        id: `occ-${slot.id}-${dateKey(cursor)}`,
        templateId: slot.id,
        offeringId: slot.offeringId,
        locationId: slot.locationId,
        courtId: slot.courtId,
        coachStaffId: slot.coachStaffId,
        startsAt: atTimeOn(cursor, slot.startTime),
        endsAt: atTimeOn(cursor, slot.endTime),
        capacity: slot.capacity,
        source: "template",
        cancelled: false,
      };
      assertNoOverlap(session, sessions);
      sessions.push(session);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
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
    if (ex.type === "cancel") {
      const row = byId.get(ex.occurrenceId);
      if (!row) continue;
      row.cancelled = true;
      row.source = "exception";
      continue;
    }
    const row = byId.get(ex.occurrenceId);
    if (!row) continue;
    Object.assign(row, ex.patch);
    row.source = "exception";
  }

  return next;
}

export function mondayOf(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export function hhmm(d: Date): string {
  return d.toISOString().slice(11, 16);
}
