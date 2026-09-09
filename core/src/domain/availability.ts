import { atTimeOn } from "./template";
import type { DayOfWeek } from "./types";

export type AvailabilityBlock = {
  coachId: string;
  locationId: string;
  weekday: DayOfWeek;
  startTime: string;
  endTime: string;
};

/** Half-open [start, end): 06:00–11:00 → 06, 07, 08, 09, 10. */
export function hoursInRange(startTime: string, endTime: string): string[] {
  const start = minutes(startTime);
  const end = minutes(endTime);
  const out: string[] = [];
  for (let m = start; m + 60 <= end; m += 60) {
    out.push(hhmm(m));
  }
  return out;
}

export function slotStarts(day: Date, hour: string): Date {
  return atTimeOn(day, hour);
}

export function slotEnds(starts: Date, durationMinutes = 60): Date {
  return new Date(starts.getTime() + durationMinutes * 60_000);
}

export function openSlotId(locationId: string, coachId: string, startsAt: Date): string {
  return `open:${locationId}:${coachId}:${startsAt.toISOString()}`;
}

export function parseOpenSlotId(id: string): { locationId: string; coachId: string; startsAt: Date } | null {
  if (!id.startsWith("open:")) return null;
  const rest = id.slice("open:".length);
  const locEnd = rest.indexOf(":");
  if (locEnd < 0) return null;
  const locationId = rest.slice(0, locEnd);
  const afterLoc = rest.slice(locEnd + 1);
  const coachEnd = afterLoc.indexOf(":");
  if (coachEnd < 0) return null;
  const coachId = afterLoc.slice(0, coachEnd);
  const iso = afterLoc.slice(coachEnd + 1);
  const startsAt = new Date(iso);
  if (!locationId || !coachId || Number.isNaN(startsAt.getTime())) return null;
  return { locationId, coachId, startsAt };
}

function minutes(hhmmValue: string): number {
  const [h, m] = hhmmValue.split(":").map(Number);
  return h * 60 + m;
}

function hhmm(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
