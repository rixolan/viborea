/**
 * Dates as the academia's sede sees them.
 *
 * The API sends `local_date` / `local_time` for anything with a grid position,
 * so prefer those. These helpers cover the rest, and never use the viewer's
 * own timezone: a player checking their class from Madrid must still read the
 * Asunción hour.
 */
const DAY_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DAY_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export const DOW_HEADINGS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

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
  });
  FORMATTERS.set(timeZone, made);
  return made;
}

export type Wall = { year: number; month: number; day: number; hour: number; minute: number; weekday: number };

export function wallOf(iso: string, timeZone: string): Wall {
  const parts = formatter(timeZone).formatToParts(new Date(iso));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const year = get("year");
  const month = get("month");
  const day = get("day");
  return {
    year,
    month,
    day,
    hour: get("hour"),
    minute: get("minute"),
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** `15:00` */
export function timeAt(iso: string, timeZone: string): string {
  const w = wallOf(iso, timeZone);
  return `${pad2(w.hour)}:${pad2(w.minute)}`;
}

/** `2026-09-14` */
export function dateAt(iso: string, timeZone: string): string {
  const w = wallOf(iso, timeZone);
  return `${w.year}-${pad2(w.month)}-${pad2(w.day)}`;
}

/** `lunes 14 sep` */
export function dayAt(iso: string, timeZone: string): string {
  const w = wallOf(iso, timeZone);
  return `${DAY_LONG[w.weekday]} ${w.day} ${MONTH_SHORT[w.month - 1]}`;
}

/** `lun 14 sep · 15:00` */
export function whenAt(iso: string, timeZone: string): string {
  const w = wallOf(iso, timeZone);
  return `${DAY_SHORT[w.weekday]} ${w.day} ${MONTH_SHORT[w.month - 1]} · ${pad2(w.hour)}:${pad2(w.minute)}`;
}

// --- calendar helpers on local date keys (`YYYY-MM-DD`), no timezone needed ---

export function keyToDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDaysToKey(dateKey: string, days: number): string {
  const d = keyToDate(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of this week, in the viewer's own calendar: only a starting guess. */
export function thisMondayKey(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function dayLabel(dateKey: string): string {
  const d = keyToDate(dateKey);
  return `${DAY_SHORT[d.getUTCDay()]} ${d.getUTCDate()}`;
}

export function dayLongLabel(dateKey: string): string {
  const d = keyToDate(dateKey);
  return `${DAY_LONG[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]}`;
}

/** `14–20 sep 2026` */
export function weekLabel(mondayKey: string): string {
  const a = keyToDate(mondayKey);
  const b = keyToDate(addDaysToKey(mondayKey, 6));
  return `${a.getUTCDate()}–${b.getUTCDate()} ${MONTH_SHORT[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
}

/** `06:00`, `07:00`, … for the hours a presence block covers. */
export function hoursBetween(startTime: string, endTime: string): string[] {
  const minutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const out: string[] = [];
  for (let m = minutes(startTime); m + 60 <= minutes(endTime); m += 60) {
    out.push(`${pad2(Math.floor(m / 60))}:00`);
  }
  return out;
}

export function nextHour(hour: string): string {
  return `${pad2(Number(hour.slice(0, 2)) + 1)}:00`;
}
