/**
 * Wall-clock time in the academy's timezone.
 *
 * A template row says "monday 15:00". A `coach_availability` block says
 * "06:00–11:00". Those are local wall clocks at the sede, not UTC. Everything
 * stored in Postgres is a real instant (`TIMESTAMPTZ`), so the conversion has
 * to happen here and nowhere else.
 */
import { DAY_FROM_JS, type DayOfWeek } from "./types";

export const DEFAULT_TIMEZONE = "America/Asuncion";

const FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  const cached = FORMATTERS.get(timeZone);
  if (cached) return cached;
  const made = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  FORMATTERS.set(timeZone, made);
  return made;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

type Wall = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function wallOf(timeZone: string, at: Date): Wall {
  const parts = formatter(timeZone).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Offset of `timeZone` at that instant, in ms (Asunción → -10_800_000). */
export function offsetMs(timeZone: string, at: Date): number {
  const w = wallOf(timeZone, at);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** `2026-09-14` + `15:00` in Asunción → the 18:00Z instant. */
export function instantFrom(dateKey: string, time: string, timeZone: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    throw new RangeError(`Fecha inválida: ${dateKey}`);
  }
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) {
    throw new RangeError(`Hora inválida: ${time}`);
  }
  const wall = Date.UTC(y, m - 1, d, hh, mm, 0, 0);
  // Two passes: the offset depends on the instant we are still solving for.
  let guess = wall - offsetMs(timeZone, new Date(wall));
  guess = wall - offsetMs(timeZone, new Date(guess));
  return new Date(guess);
}

/** Local calendar date of that instant, `YYYY-MM-DD`. */
export function dateKeyIn(timeZone: string, at: Date): string {
  const w = wallOf(timeZone, at);
  return `${w.year}-${pad2(w.month)}-${pad2(w.day)}`;
}

/** Local wall clock of that instant, `HH:MM`. */
export function timeIn(timeZone: string, at: Date): string {
  const w = wallOf(timeZone, at);
  return `${pad2(w.hour)}:${pad2(w.minute)}`;
}

/** A calendar date key as a UTC-midnight Date, for weekday arithmetic only. */
export function keyToUtc(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function keyOfUtc(at: Date): string {
  return at.toISOString().slice(0, 10);
}

export function weekdayOfKey(dateKey: string): DayOfWeek {
  return DAY_FROM_JS[keyToUtc(dateKey).getUTCDay()];
}

export function weekdayIn(timeZone: string, at: Date): DayOfWeek {
  return weekdayOfKey(dateKeyIn(timeZone, at));
}

export function addDaysToKey(dateKey: string, days: number): string {
  const d = keyToUtc(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  return keyOfUtc(d);
}

/** Monday of the week that calendar date belongs to. */
export function mondayKeyOf(dateKey: string): string {
  const day = keyToUtc(dateKey).getUTCDay();
  return addDaysToKey(dateKey, day === 0 ? -6 : 1 - day);
}

export function mondayKeyIn(timeZone: string, at: Date): string {
  return mondayKeyOf(dateKeyIn(timeZone, at));
}

/** Half-open [monday 00:00 local, next monday 00:00 local). */
export function weekWindow(mondayKey: string, timeZone: string): { from: Date; to: Date } {
  return {
    from: instantFrom(mondayKey, "00:00", timeZone),
    to: instantFrom(addDaysToKey(mondayKey, 7), "00:00", timeZone),
  };
}

export function minutesOfTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function timeOfMinutes(total: number): string {
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/** `HH:MM` inside one calendar day. `24:00` is allowed as an end bound. */
export function parseTimeOfDay(raw: string, { allowEndOfDay = false } = {}): string {
  const value = String(raw ?? "").trim();
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new RangeError("Hora inválida. Usá HH:MM.");
  const h = Number(match[1]);
  const m = Number(match[2]);
  const limit = allowEndOfDay ? 24 : 23;
  if (h < 0 || h > limit || m < 0 || m > 59 || (h === 24 && m !== 0)) {
    throw new RangeError("Hora inválida. Usá HH:MM.");
  }
  return `${pad2(h)}:${pad2(m)}`;
}
