import type { DayOfWeek, WeeklyTemplateSlot } from "./domain/types";
import { nextBookingStatus } from "./domain/capacity";
import { dateKey, materializeTemplate, mondayOf } from "./domain/template";
import { addDays } from "./domain/template";
import {
  DEFAULT_TIMEZONE,
  addDaysToKey,
  dateKeyIn,
  isValidTimeZone,
  minutesOfTime,
  mondayKeyOf,
  parseTimeOfDay,
  timeOfMinutes,
  timeIn,
  weekWindow,
  weekdayIn,
  weekdayOfKey,
} from "./domain/timezone";
import {
  consumeOnConfirm,
  offeringKindFromCapacity,
  purchasePack as newPack,
  restoreOnCancel,
  type ClassPack,
  type PackAlert,
  type PackSize,
} from "./domain/pack";
import { parseCategory, parseSide, type PlayingSide, type StudentCategory } from "./domain/student";
import { parseSlug } from "./domain/slug";
import { parsePhone } from "./domain/phone";
import { OCCUPYING_BOOKING_STATUSES, type BookingStatus } from "./domain/types";

export const WEEKDAYS: readonly DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function parseWeekday(raw: string | undefined): DayOfWeek {
  const value = String(raw ?? "").trim().toLowerCase() as DayOfWeek;
  if (!WEEKDAYS.includes(value)) throw new Error("Día de la semana inválido");
  return value;
}

function requiredText(raw: string | null | undefined, field: string, max = 80): string {
  const value = String(raw ?? "").trim();
  if (!value) throw new Error(`Falta ${field}`);
  if (value.length > max) throw new Error(`${field}: máximo ${max} caracteres`);
  return value;
}

function optionalText(raw: string | null | undefined, field: string, max = 500): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (value.length > max) throw new Error(`${field}: máximo ${max} caracteres`);
  return value;
}

function shortId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
import { OverlapError } from "./domain/types";
import { cutoffMessage, DEFAULT_CUTOFF_HOURS, parseCutoffHours, selfServeOpen } from "./domain/cutoff";
import {
  blocksOverlap,
  hoursInRange,
  openSlotId,
  parseOpenSlotId,
  slotEnds,
  slotStarts,
  type AvailabilityBlock,
} from "./domain/availability";
import { connect, type Db } from "./db/pg";
import { migrate } from "./db/migrate";

export type { Db };

export type Academy = {
  id: string;
  slug: string;
  name: string;
  locale: string;
  currency: string;
  timezone: string;
  cutoff_hours: number;
  hold_minutes: number;
  clerk_org_id: string | null;
};
export type Location = {
  id: string;
  name: string;
  address: string | null;
  maps_url: string | null;
  image_url: string | null;
};
export type Court = { id: string; location_id: string; name: string; number: number };
export type Coach = { id: string; name: string; bio: string | null; languages: string[]; location_ids: string[] };
export type Offering = {
  id: string;
  name: string;
  duration_minutes: number;
  capacity: number;
  price: number;
};
export type Student = {
  id: string;
  academy_id: string;
  name: string;
  phone: string;
  clerk_user_id: string | null;
  /** Opaque bearer for the guest cookie. Never shown to the player. */
  cookie_token: string;
  category: StudentCategory;
  side: PlayingSide | null;
};

export class ClaimedFichaError extends Error {
  constructor() {
    super("Esta ficha tiene cuenta. Entrá para reservar.");
    this.name = "ClaimedFichaError";
  }
}

export type SessionView = {
  id: string;
  template_id: string | null;
  offering_id: string;
  offering_name: string;
  location_id: string;
  location_name: string;
  court_id: string;
  court_name: string;
  coach_id: string;
  coach_name: string;
  starts_at: string;
  ends_at: string;
  local_date: string;
  local_time: string;
  time_zone: string;
  capacity: number;
  source: string;
  cancelled: number;
  booked: number;
  pending: number;
  confirmed: number;
};

export type BookingView = {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  status: BookingStatus;
  category: StudentCategory;
  side: PlayingSide | null;
};

export type PlayerBooking = {
  id: string;
  session_id: string;
  manage_token: string;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  local_date: string;
  local_time: string;
  time_zone: string;
  offering_name: string;
  coach_name: string;
  location_name: string;
  court_name: string;
};

export const MAX_REMINDER_ATTEMPTS = 3;

export type ReminderDue = {
  id: string;
  manage_token: string;
  academy_id: string;
  slug: string;
  phone: string;
  starts_at: string;
  offering_name: string;
  coach_name: string;
  location_name: string;
  cutoff_hours: number;
  timezone: string;
};

export type ManageBooking = PlayerBooking & {
  student_id: string;
  offering_id: string;
  can_change: boolean;
};

function iso(v: unknown): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function flag(v: unknown): number {
  return v === true || v === 1 || v === "t" ? 1 : 0;
}

function num(v: unknown): number {
  return Number(v);
}

function studentFrom(row: {
  id: string;
  academy_id: string;
  name: string;
  phone: string;
  clerk_user_id?: string | null;
  cookie_token?: string | null;
  category: string;
  side: string | null;
}): Student {
  return {
    id: row.id,
    academy_id: row.academy_id,
    name: row.name,
    phone: row.phone,
    clerk_user_id: row.clerk_user_id ?? null,
    cookie_token: String(row.cookie_token ?? ""),
    category: parseCategory(row.category),
    side: parseSide(row.side),
  };
}

function academyFrom(row: Record<string, unknown>): Academy {
  const hours = num(row.cutoff_hours);
  const zone = String(row.timezone ?? "");
  const hold = num(row.hold_minutes);
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    locale: String(row.locale),
    currency: String(row.currency),
    timezone: isValidTimeZone(zone) ? zone : DEFAULT_TIMEZONE,
    cutoff_hours: hours > 0 ? hours : DEFAULT_CUTOFF_HOURS,
    hold_minutes: Number.isFinite(hold) && hold > 0 ? hold : 0,
    clerk_org_id: row.clerk_org_id ? String(row.clerk_org_id) : null,
  };
}

export type WeekRef = Date | string;

export type WeekWindow = {
  mondayKey: string;
  timeZone: string;
  from: Date;
  to: Date;
};

/**
 * The week a request means, in the academy's own timezone. `ref` is either an
 * instant or a local `YYYY-MM-DD`; both resolve to the local Monday whose
 * midnight starts the window.
 */
export function weekOfAcademy(academy: Academy, ref: WeekRef): WeekWindow {
  const timeZone = academy.timezone;
  const key = typeof ref === "string" ? ref : dateKeyIn(timeZone, ref);
  const mondayKey = mondayKeyOf(key);
  return { mondayKey, timeZone, ...weekWindow(mondayKey, timeZone) };
}

export async function weekOf(db: Db, academyId: string, ref: WeekRef): Promise<WeekWindow> {
  return weekOfAcademy(await academyById(db, academyId), ref);
}

/** Postgres exclusion violation: the court or the coach is already taken. */
function isOverlapViolation(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return code === "23P01";
}

function overlapFrom(err: unknown, sessionId: string): OverlapError {
  const detail = String((err as { constraint_name?: string } | null)?.constraint_name ?? "");
  const kind = detail.includes("coach") ? "coach" : "court";
  return new OverlapError([{ kind, sessionId, otherSessionId: "" }]);
}

function sessionFrom(row: Record<string, unknown>, timeZone: string): SessionView {
  const startsAt = iso(row.starts_at);
  return {
    id: String(row.id),
    template_id: (row.template_id as string | null) ?? null,
    offering_id: String(row.offering_id),
    offering_name: String(row.offering_name),
    location_id: String(row.location_id),
    location_name: String(row.location_name),
    court_id: String(row.court_id),
    court_name: String(row.court_name),
    coach_id: String(row.coach_id),
    coach_name: String(row.coach_name),
    starts_at: startsAt,
    ends_at: iso(row.ends_at),
    local_date: dateKeyIn(timeZone, new Date(startsAt)),
    local_time: timeIn(timeZone, new Date(startsAt)),
    time_zone: timeZone,
    capacity: num(row.capacity),
    source: String(row.source),
    cancelled: flag(row.cancelled),
    booked: num(row.booked),
    pending: num(row.pending),
    confirmed: num(row.confirmed),
  };
}

const SESSION_SELECT = `
  SELECT s.id, s.template_id, s.offering_id, o.name AS offering_name, s.location_id, l.name AS location_name,
    s.court_id, c.name AS court_name, s.coach_id, ch.name AS coach_name, s.starts_at, s.ends_at, s.capacity,
    s.source, s.cancelled,
    (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status IN ('pending_payment','confirmed','checked_in')) AS booked,
    (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'pending_payment') AS pending,
    (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'confirmed') AS confirmed
  FROM sessions s
  JOIN offerings o ON o.id = s.offering_id
  JOIN locations l ON l.id = s.location_id
  JOIN courts c ON c.id = s.court_id
  JOIN coaches ch ON ch.id = s.coach_id
`;

export async function openDb(url = process.env.DATABASE_URL): Promise<Db> {
  const db = connect(url);
  await migrate(db);
  return db;
}

export async function academyById(db: Db, id: string): Promise<Academy> {
  const [row] = await db`SELECT * FROM academy WHERE id = ${id}`;
  if (!row) throw new Error("Academy not seeded");
  return academyFrom(row as Record<string, unknown>);
}

export async function academyBySlug(db: Db, slug: string): Promise<Academy | null> {
  const [row] = await db`SELECT * FROM academy WHERE slug = ${slug}`;
  return row ? academyFrom(row as Record<string, unknown>) : null;
}

export async function academyByClerkOrg(db: Db, orgId: string): Promise<Academy | null> {
  const [row] = await db`SELECT * FROM academy WHERE clerk_org_id = ${orgId}`;
  return row ? academyFrom(row as Record<string, unknown>) : null;
}

export async function listAcademies(db: Db): Promise<Academy[]> {
  const rows = await db`SELECT * FROM academy ORDER BY name`;
  return rows.map((row) => academyFrom(row as Record<string, unknown>));
}

export async function bookerRedirectSlug(db: Db): Promise<string | null> {
  const rows = await db`SELECT slug FROM academy ORDER BY slug`;
  if (rows.length === 1) return String(rows[0].slug);
  return null;
}

export async function updateCutoffHours(db: Db, academyId: string, raw: string | number): Promise<number> {
  const hours = parseCutoffHours(raw);
  await db`UPDATE academy SET cutoff_hours = ${hours} WHERE id = ${academyId}`;
  return hours;
}

export const MAX_HOLD_MINUTES = 20_160;

export function parseHoldMinutes(raw: string | number | null | undefined): number {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isInteger(n) || n < 0 || n > MAX_HOLD_MINUTES) {
    throw new Error(`El plazo de pago va de 0 a ${MAX_HOLD_MINUTES} minutos (0 = sin vencimiento)`);
  }
  return n;
}

export async function updateAcademySettings(
  db: Db,
  academyId: string,
  patch: { name?: string; timezone?: string; cutoff_hours?: string | number; hold_minutes?: string | number; currency?: string },
): Promise<Academy> {
  const current = await academyById(db, academyId);
  const name = patch.name?.trim() || current.name;
  const timezone = patch.timezone?.trim() || current.timezone;
  if (!isValidTimeZone(timezone)) throw new Error("Zona horaria inválida. Ej: America/Asuncion");
  const cutoff = patch.cutoff_hours === undefined ? current.cutoff_hours : parseCutoffHours(patch.cutoff_hours);
  const hold = patch.hold_minutes === undefined ? current.hold_minutes : parseHoldMinutes(patch.hold_minutes);
  const currency = (patch.currency?.trim() || current.currency).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Moneda inválida. Usá tres letras, ej: PYG");
  await db`
    UPDATE academy
    SET name = ${name}, timezone = ${timezone}, cutoff_hours = ${cutoff}, hold_minutes = ${hold}, currency = ${currency}
    WHERE id = ${academyId}
  `;
  return academyById(db, academyId);
}

export async function catalogs(db: Db, academyId: string) {
  const [locations, courts, coaches, offerings, students, availability] = await Promise.all([
    db`SELECT * FROM locations WHERE academy_id = ${academyId} ORDER BY name`,
    db`SELECT * FROM courts WHERE academy_id = ${academyId} ORDER BY location_id, number`,
    db`SELECT id, name, bio, languages FROM coaches WHERE academy_id = ${academyId} ORDER BY name`,
    db`SELECT * FROM offerings WHERE academy_id = ${academyId} ORDER BY capacity`,
    db`SELECT * FROM students WHERE academy_id = ${academyId} ORDER BY name`,
    db`SELECT DISTINCT coach_id, location_id FROM coach_availability WHERE academy_id = ${academyId}`,
  ]);
  const locByCoach = new Map<string, string[]>();
  for (const row of availability as unknown as { coach_id: string; location_id: string }[]) {
    const list = locByCoach.get(row.coach_id) ?? [];
    if (!list.includes(row.location_id)) list.push(row.location_id);
    locByCoach.set(row.coach_id, list);
  }
  return {
    locations: locations as unknown as Location[],
    courts: courts as unknown as Court[],
    coaches: (coaches as unknown as { id: string; name: string; bio: string | null; languages: string[] | null }[]).map((c) => ({
      id: c.id,
      name: c.name,
      bio: c.bio ?? null,
      languages: c.languages ?? [],
      location_ids: locByCoach.get(c.id) ?? [],
    })),
    offerings: offerings as unknown as Offering[],
    students: (students as unknown as Parameters<typeof studentFrom>[0][]).map(studentFrom),
  };
}

export async function ensureWeek(db: Db, academyId: string, ref: WeekRef): Promise<WeekWindow> {
  const win = await weekOf(db, academyId, ref);
  const templates = await db`SELECT * FROM templates WHERE academy_id = ${academyId}`;
  const offerings = await db`SELECT id, capacity FROM offerings WHERE academy_id = ${academyId}`;
  const capacity = new Map((offerings as unknown as { id: string; capacity: number }[]).map((o) => [o.id, o.capacity]));
  const slots: WeeklyTemplateSlot[] = (
    templates as unknown as {
      id: string;
      offering_id: string;
      location_id: string;
      court_id: string;
      coach_id: string;
      weekday: DayOfWeek;
      start_time: string;
      end_time: string;
    }[]
  ).map((t) => ({
    id: t.id,
    offeringId: t.offering_id,
    locationId: t.location_id,
    courtId: t.court_id,
    coachStaffId: t.coach_id,
    dayOfWeek: t.weekday,
    startTime: t.start_time,
    endTime: t.end_time,
    capacity: capacity.get(t.offering_id) ?? 1,
  }));
  const materialized = materializeTemplate(slots, {
    fromKey: win.mondayKey,
    toKey: addDaysToKey(win.mondayKey, 7),
    timeZone: win.timeZone,
  });
  // One statement per row, not one transaction: a template occurrence that
  // clashes with a one-off already on that court is skipped instead of
  // failing the whole week the booker is trying to read.
  for (const s of materialized) {
    try {
      await db`
        INSERT INTO sessions (id, academy_id, template_id, offering_id, location_id, court_id, coach_id, starts_at, ends_at, capacity, source, cancelled)
        VALUES (${s.id}, ${academyId}, ${s.templateId}, ${s.offeringId}, ${s.locationId}, ${s.courtId}, ${s.coachStaffId}, ${s.startsAt}, ${s.endsAt}, ${s.capacity}, ${s.source}, false)
        ON CONFLICT (id) DO NOTHING
      `;
    } catch (err) {
      if (!isOverlapViolation(err)) throw err;
    }
  }
  return win;
}

async function weekSessionsIn(db: Db, academy: Academy, win: WeekWindow): Promise<SessionView[]> {
  const rows = await db.unsafe(
    `${SESSION_SELECT} WHERE s.academy_id = $1 AND s.starts_at >= $2 AND s.starts_at < $3 ORDER BY s.starts_at, l.name, c.number`,
    [academy.id, win.from, win.to],
  );
  return rows.map((row) => sessionFrom(row as Record<string, unknown>, academy.timezone));
}

export async function weekSessions(db: Db, academyId: string, ref: WeekRef): Promise<SessionView[]> {
  const academy = await academyById(db, academyId);
  return weekSessionsIn(db, academy, weekOfAcademy(academy, ref));
}

function occupies(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function occupyingOf(sessions: SessionView[]): SessionView[] {
  return sessions.filter((s) => s.cancelled === 0);
}

export async function weekGrid(db: Db, academyId: string, ref: WeekRef): Promise<SessionView[]> {
  const academy = await academyById(db, academyId);
  const win = weekOfAcademy(academy, ref);
  const timeZone = academy.timezone;
  const locked = occupyingOf(await weekSessionsIn(db, academy, win));
  const [blocks, courts, coaches, locations, offerings] = await Promise.all([
    db`SELECT coach_id, location_id, weekday, start_time, end_time FROM coach_availability WHERE academy_id = ${academyId}`,
    db`SELECT id, location_id FROM courts WHERE academy_id = ${academyId}`,
    db`SELECT id, name FROM coaches WHERE academy_id = ${academyId}`,
    db`SELECT id, name FROM locations WHERE academy_id = ${academyId}`,
    db`SELECT capacity FROM offerings WHERE academy_id = ${academyId}`,
  ]);
  const openCapacity = Math.max(
    1,
    ...(offerings as unknown as { capacity: number }[]).map((o) => num(o.capacity)).filter((n) => Number.isFinite(n)),
  );
  const coachName = new Map((coaches as unknown as { id: string; name: string }[]).map((c) => [c.id, c.name]));
  const locName = new Map((locations as unknown as { id: string; name: string }[]).map((l) => [l.id, l.name]));
  const courtsAt = (locationId: string) => (courts as unknown as { id: string; location_id: string }[]).filter((c) => c.location_id === locationId);
  const out: SessionView[] = [];
  const seen = new Set<string>();
  // A coach cannot be at two sedes in the same hour. Seeded availability can
  // still say so (DG has overlapping blocks), and offering both holes would
  // hand the second player an overlap error at the end of the flow.
  const holeTaken = new Set<string>();

  for (let d = 0; d < 7; d++) {
    const dayKey = addDaysToKey(win.mondayKey, d);
    const weekday = weekdayOfKey(dayKey);
    for (const b of blocks as unknown as { coach_id: string; location_id: string; weekday: string; start_time: string; end_time: string }[]) {
      if (b.weekday !== weekday) continue;
      for (const hour of hoursInRange(b.start_time, b.end_time)) {
        const starts = slotStarts(dayKey, hour, timeZone);
        const ends = slotEnds(starts);
        const coachBusy = locked.find(
          (s) => s.coach_id === b.coach_id && occupies(starts, ends, new Date(s.starts_at), new Date(s.ends_at)),
        );
        if (coachBusy) {
          if (coachBusy.location_id === b.location_id && !seen.has(coachBusy.id)) {
            seen.add(coachBusy.id);
            out.push(coachBusy);
          }
          continue;
        }
        const holeKey = `${b.coach_id}|${starts.toISOString()}`;
        if (holeTaken.has(holeKey)) continue;
        const freeCourt = courtsAt(b.location_id).some(
          (c) => !locked.some((s) => s.court_id === c.id && occupies(starts, ends, new Date(s.starts_at), new Date(s.ends_at))),
        );
        if (!freeCourt) continue;
        holeTaken.add(holeKey);
        out.push({
          id: openSlotId(b.location_id, b.coach_id, starts),
          template_id: null,
          offering_id: "",
          offering_name: "Libre",
          location_id: b.location_id,
          location_name: locName.get(b.location_id) ?? b.location_id,
          court_id: "",
          court_name: "",
          coach_id: b.coach_id,
          coach_name: coachName.get(b.coach_id) ?? b.coach_id,
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
          local_date: dayKey,
          local_time: hour,
          time_zone: timeZone,
          capacity: openCapacity,
          source: "availability",
          cancelled: 0,
          booked: 0,
          pending: 0,
          confirmed: 0,
        });
      }
    }
  }
  for (const s of locked) {
    if (!seen.has(s.id)) out.push(s);
  }
  out.sort((a, b) => a.starts_at.localeCompare(b.starts_at) || a.coach_name.localeCompare(b.coach_name));
  return out;
}

/** Asked inside the booking transaction, so the answer cannot go stale. */
async function firstFreeCourt(db: Db, academyId: string, locationId: string, startsAt: Date, endsAt: Date): Promise<string> {
  const [court] = await db`
    SELECT c.id FROM courts c
    WHERE c.academy_id = ${academyId} AND c.location_id = ${locationId}
      AND NOT EXISTS (
        SELECT 1 FROM sessions s
        WHERE s.court_id = c.id AND s.cancelled = false
          AND tstzrange(s.starts_at, s.ends_at) && tstzrange(${startsAt}, ${endsAt})
      )
    ORDER BY c.number
    LIMIT 1
  `;
  if (!court) throw new Error("No hay pista libre en esa sede");
  return String(court.id);
}

async function getSessionIn(db: Db, academy: Academy, id: string): Promise<SessionView | null> {
  const academyId = academy.id;
  const timeZone = academy.timezone;
  const open = parseOpenSlotId(id);
  if (open) {
    const [existing] = await db.unsafe(
      `${SESSION_SELECT} WHERE s.academy_id = $1 AND s.coach_id = $2 AND s.location_id = $3 AND s.starts_at = $4 AND s.cancelled = false`,
      [academyId, open.coachId, open.locationId, open.startsAt],
    );
    if (existing) return sessionFrom(existing as Record<string, unknown>, timeZone);
    const [coach] = await db`SELECT name FROM coaches WHERE id = ${open.coachId} AND academy_id = ${academyId}`;
    const [loc] = await db`SELECT name FROM locations WHERE id = ${open.locationId} AND academy_id = ${academyId}`;
    if (!coach || !loc) return null;
    const [capacityRow] = await db`SELECT MAX(capacity) AS capacity FROM offerings WHERE academy_id = ${academyId}`;
    const ends = slotEnds(open.startsAt);
    return {
      id,
      template_id: null,
      offering_id: "",
      offering_name: "Libre",
      location_id: open.locationId,
      location_name: String(loc.name),
      court_id: "",
      court_name: "",
      coach_id: open.coachId,
      coach_name: String(coach.name),
      starts_at: open.startsAt.toISOString(),
      ends_at: ends.toISOString(),
      local_date: dateKeyIn(timeZone, open.startsAt),
      local_time: timeIn(timeZone, open.startsAt),
      time_zone: timeZone,
      capacity: Math.max(1, num(capacityRow?.capacity) || 1),
      source: "availability",
      cancelled: 0,
      booked: 0,
      pending: 0,
      confirmed: 0,
    };
  }
  const rows = await db.unsafe(`${SESSION_SELECT} WHERE s.academy_id = $1 AND s.id = $2`, [academyId, id]);
  const row = rows[0];
  return row ? sessionFrom(row as Record<string, unknown>, timeZone) : null;
}

export async function getSession(db: Db, academyId: string, id: string): Promise<SessionView | null> {
  return getSessionIn(db, await academyById(db, academyId), id);
}

export async function sessionBookings(db: Db, academyId: string, sessionId: string): Promise<BookingView[]> {
  const session = await getSession(db, academyId, sessionId);
  if (!session) return [];
  const rows = await db`
    SELECT b.id, b.session_id, b.student_id, st.name AS student_name, b.status, st.category, st.side
    FROM bookings b
    JOIN students st ON st.id = b.student_id
    WHERE b.session_id = ${sessionId} AND st.academy_id = ${academyId}
    ORDER BY st.name
  `;
  return rows.map((row) => ({
    id: String(row.id),
    session_id: String(row.session_id),
    student_id: String(row.student_id),
    student_name: String(row.student_name),
    status: row.status as BookingStatus,
    category: parseCategory(String(row.category)),
    side: parseSide(row.side as string | null),
  }));
}

export async function createSession(
  db: Db,
  academyId: string,
  input: {
    offeringId: string;
    courtId: string;
    coachId: string;
    startsAt: Date;
  },
): Promise<string> {
  const [offering] = await db`SELECT * FROM offerings WHERE id = ${input.offeringId} AND academy_id = ${academyId}`;
  const [court] = await db`SELECT * FROM courts WHERE id = ${input.courtId} AND academy_id = ${academyId}`;
  if (!offering || !court) throw new Error("Offering o pista inexistente");
  const off = offering as Offering;
  const ct = court as Court;
  const [coach] = await db`SELECT id FROM coaches WHERE id = ${input.coachId} AND academy_id = ${academyId}`;
  if (!coach) throw new Error("Entrenador inexistente");
  const endsAt = new Date(input.startsAt.getTime() + off.duration_minutes * 60_000);
  const id = crypto.randomUUID();
  // No read-then-write check: the exclusion constraints on `sessions` are the
  // only place that can decide this without a race.
  try {
    await db`
      INSERT INTO sessions (id, academy_id, template_id, offering_id, location_id, court_id, coach_id, starts_at, ends_at, capacity, source, cancelled)
      VALUES (${id}, ${academyId}, null, ${off.id}, ${ct.location_id}, ${ct.id}, ${input.coachId}, ${input.startsAt}, ${endsAt}, ${off.capacity}, 'one_off', false)
    `;
  } catch (err) {
    if (isOverlapViolation(err)) throw overlapFrom(err, id);
    throw err;
  }
  return id;
}

export type CancelledSession = {
  session: SessionView;
  affected: { booking_id: string; student_id: string; name: string; phone: string }[];
};

/**
 * The academy calls off a class: the session stops occupying the grid and every
 * booking on it is cancelled with its pack class handed back, regardless of
 * cutoff — the player did not choose this.
 */
export async function cancelSession(db: Db, academyId: string, id: string): Promise<CancelledSession | null> {
  return db.begin(async (raw) => {
    const tx = raw as unknown as Db;
    const academy = await academyById(tx, academyId);
    const session = await getSessionIn(tx, academy, id);
    if (!session || session.cancelled === 1 || session.source === "availability") return null;
    const rows = await tx`
      SELECT b.id, b.session_id, b.student_id, b.status, b.pack_id, st.name, st.phone
      FROM bookings b
      JOIN students st ON st.id = b.student_id
      WHERE b.session_id = ${id} AND b.status <> 'cancelled'
    `;
    for (const row of rows) {
      await applyCancel(tx, academyId, row as unknown as Parameters<typeof applyCancel>[2], false, { restorePack: true });
    }
    await tx`UPDATE sessions SET cancelled = true, source = 'exception' WHERE id = ${id} AND academy_id = ${academyId}`;
    return {
      session: { ...session, cancelled: 1 },
      affected: rows
        .filter((row) => OCCUPYING_BOOKING_STATUSES.has(row.status as BookingStatus))
        .map((row) => ({
          booking_id: String(row.id),
          student_id: String(row.student_id),
          name: String(row.name),
          phone: String(row.phone),
        })),
    };
  });
}

export async function findOrCreateStudent(
  db: Db,
  academyId: string,
  name: string,
  phone: string,
  extra?: { category?: StudentCategory; side?: PlayingSide | null; clerkUserId?: string | null },
): Promise<Student> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Nombre y teléfono son obligatorios");
  const trimmedPhone = parsePhone(phone);
  const [existing] = await db`SELECT * FROM students WHERE academy_id = ${academyId} AND phone = ${trimmedPhone}`;
  if (existing) {
    const row = studentFrom(existing as unknown as Parameters<typeof studentFrom>[0]);
    if (row.clerk_user_id && extra?.clerkUserId && row.clerk_user_id !== extra.clerkUserId) {
      throw new ClaimedFichaError();
    }
    const category = extra?.category ?? row.category;
    const side = extra?.side === undefined ? row.side : extra.side;
    const clerkUserId = row.clerk_user_id ?? extra?.clerkUserId ?? null;
    if (row.name !== trimmedName || category !== row.category || side !== row.side || clerkUserId !== row.clerk_user_id) {
      await db`UPDATE students SET name = ${trimmedName}, category = ${category}, side = ${side}, clerk_user_id = ${clerkUserId} WHERE id = ${row.id}`;
      return { ...row, name: trimmedName, category, side, clerk_user_id: clerkUserId };
    }
    return row;
  }
  const [created] = await db`
    INSERT INTO students (id, academy_id, name, phone, clerk_user_id, category, side)
    VALUES (${crypto.randomUUID()}, ${academyId}, ${trimmedName}, ${trimmedPhone}, ${extra?.clerkUserId ?? null},
      ${extra?.category ?? "beginner"}, ${extra?.side ?? null})
    RETURNING *
  `;
  return studentFrom(created as unknown as Parameters<typeof studentFrom>[0]);
}

export async function updateStudent(
  db: Db,
  academyId: string,
  id: string,
  patch: { name?: string; category?: StudentCategory; side?: PlayingSide | null },
): Promise<void> {
  const [row] = await db`SELECT * FROM students WHERE id = ${id} AND academy_id = ${academyId}`;
  if (!row) throw new Error("Alumno inexistente");
  const current = studentFrom(row as unknown as Parameters<typeof studentFrom>[0]);
  const name = patch.name?.trim() || current.name;
  const category = patch.category ?? current.category;
  const side = patch.side === undefined ? current.side : patch.side;
  await db`UPDATE students SET name = ${name}, category = ${category}, side = ${side} WHERE id = ${id}`;
}
export async function identifyPlayer(
  db: Db,
  academyId: string,
  input: {
    clerkUserId?: string | null;
    cookieToken?: string | null;
    /** Legacy signed cookie, which carried the id instead of a token. */
    cookieStudentId?: string | null;
    claimCookie?: boolean;
  },
): Promise<Student | null> {
  const fromCookie = async () =>
    input.cookieToken
      ? studentByCookieToken(db, academyId, input.cookieToken)
      : input.cookieStudentId
        ? studentById(db, academyId, input.cookieStudentId)
        : null;
  if (input.clerkUserId) {
    const linked = await studentByClerk(db, academyId, input.clerkUserId);
    if (linked) return linked;
    if (input.claimCookie) {
      const cookie = await fromCookie();
      if (cookie && !cookie.clerk_user_id) {
        await db`UPDATE students SET clerk_user_id = ${input.clerkUserId}
          WHERE id = ${cookie.id} AND academy_id = ${academyId} AND clerk_user_id IS NULL`;
        return { ...cookie, clerk_user_id: input.clerkUserId };
      }
    }
    return null;
  }
  const cookie = await fromCookie();
  if (!cookie || cookie.clerk_user_id) return null;
  return cookie;
}
export async function studentByClerk(
  db: Db,
  academyId: string,
  clerkUserId: string,
): Promise<Student | null> {
  const [row] = await db`SELECT * FROM students WHERE academy_id = ${academyId} AND clerk_user_id = ${clerkUserId}`;
  return row ? studentFrom(row as unknown as Parameters<typeof studentFrom>[0]) : null;
}

export async function studentById(db: Db, academyId: string, id: string): Promise<Student | null> {
  const [row] = await db`SELECT * FROM students WHERE id = ${id} AND academy_id = ${academyId}`;
  return row ? studentFrom(row as unknown as Parameters<typeof studentFrom>[0]) : null;
}

/** The cookie is a bearer token, and it only works on its own academia. */
export async function studentByCookieToken(db: Db, academyId: string, token: string): Promise<Student | null> {
  if (!token) return null;
  const [row] = await db`SELECT * FROM students WHERE cookie_token = ${token} AND academy_id = ${academyId}`;
  return row ? studentFrom(row as unknown as Parameters<typeof studentFrom>[0]) : null;
}

async function bookStudentIn(
  db: Db,
  academyId: string,
  sessionId: string,
  studentId: string,
  channel: "admin" | "web" = "admin",
): Promise<BookingStatus> {
  // FOR UPDATE: two players hitting the last cupo of the same class queue here
  // instead of both counting the same free seat.
  const [session] = await db`
    SELECT id, capacity, cancelled FROM sessions
    WHERE id = ${sessionId} AND academy_id = ${academyId}
    FOR UPDATE
  `;
  if (!session || flag(session.cancelled)) throw new Error("Sesión inexistente o cancelada");
  const [student] = await db`SELECT id FROM students WHERE id = ${studentId} AND academy_id = ${academyId}`;
  if (!student) throw new Error("Alumno inexistente");
  const existing = await db`SELECT status FROM bookings WHERE session_id = ${sessionId}`;
  const [already] = await db`SELECT id, status FROM bookings WHERE session_id = ${sessionId} AND student_id = ${studentId}`;
  const previous = already ? (already.status as BookingStatus) : null;
  if (previous && previous !== "cancelled" && previous !== "no_show") {
    throw new Error(previous === "waitlisted" ? "Ese alumno ya está en la lista de espera" : "Ese alumno ya está en la clase");
  }
  const status = nextBookingStatus(num(session.capacity), existing as unknown as { status: BookingStatus }[]);
  if (channel === "web" && status === "waitlisted") {
    throw new Error("Clase completa");
  }
  if (already) {
    // A cancelled booking is history, not a lock on the cupo: reuse the row so
    // the player can come back to a class they left.
    await db`
      UPDATE bookings
      SET status = ${status}, channel = ${channel}, pack_id = null, reminded_at = null,
        reminder_attempts = 0, created_at = now()
      WHERE id = ${already.id as string}
    `;
    return status;
  }
  await db`
    INSERT INTO bookings (id, session_id, student_id, status, channel)
    VALUES (${crypto.randomUUID()}, ${sessionId}, ${studentId}, ${status}, ${channel})
  `;
  return status;
}

export async function bookStudent(
  db: Db,
  academyId: string,
  sessionId: string,
  studentId: string,
  channel: "admin" | "web" = "admin",
): Promise<BookingStatus> {
  return db.begin(async (raw) => bookStudentIn(raw as unknown as Db, academyId, sessionId, studentId, channel));
}

/** Occupying bookings one ficha may hold at once. Stops grid hoarding. */
export const MAX_UPCOMING_BOOKINGS = 20;

async function assertBookingQuota(db: Db, academyId: string, studentId: string): Promise<void> {
  const [row] = await db`
    SELECT COUNT(*)::int AS n
    FROM bookings b
    JOIN sessions s ON s.id = b.session_id
    WHERE b.student_id = ${studentId} AND s.academy_id = ${academyId}
      AND s.cancelled = false AND s.starts_at > now()
      AND b.status IN ('pending_payment', 'confirmed', 'checked_in')
  `;
  if (num(row?.n) >= MAX_UPCOMING_BOOKINGS) {
    throw new Error(`Ya tenés ${MAX_UPCOMING_BOOKINGS} clases por delante. Cancelá una antes de anotarte a otra.`);
  }
}

async function applyAccountContact(db: Db, student: Student, name: string, phone: string): Promise<Student> {
  const trimmedName = name.trim();
  let nextName = student.name;
  let nextPhone = student.phone;
  if (trimmedName) nextName = trimmedName;
  if (phone.trim()) {
    try {
      const parsed = parsePhone(phone);
      if (parsed !== student.phone) {
        const [taken] = await db`SELECT id FROM students WHERE academy_id = ${student.academy_id} AND phone = ${parsed} AND id <> ${student.id}`;
        if (!taken) nextPhone = parsed;
      }
    } catch {
      // keep the ficha phone if the account number is not usable
    }
  }
  if (nextName === student.name && nextPhone === student.phone) return student;
  await db`UPDATE students SET name = ${nextName}, phone = ${nextPhone} WHERE id = ${student.id}`;
  return { ...student, name: nextName, phone: nextPhone };
}

async function resolveBookerStudent(
  db: Db,
  academyId: string,
  name: string,
  phone: string,
  extra?: {
    category?: StudentCategory;
    side?: PlayingSide | null;
    clerkUserId?: string | null;
    cookieToken?: string | null;
    cookieStudentId?: string | null;
  },
): Promise<Student> {
  if (extra?.clerkUserId) {
    const linked = await studentByClerk(db, academyId, extra.clerkUserId);
    if (linked) return applyAccountContact(db, linked, name, phone);
  }
  if (extra?.cookieToken || extra?.cookieStudentId) {
    const cookie = extra.cookieToken
      ? await studentByCookieToken(db, academyId, extra.cookieToken)
      : await studentById(db, academyId, extra.cookieStudentId as string);
    if (cookie) {
      if (cookie.clerk_user_id && extra?.clerkUserId && cookie.clerk_user_id !== extra.clerkUserId) {
        throw new ClaimedFichaError();
      }
      if (cookie.clerk_user_id && !extra?.clerkUserId) throw new ClaimedFichaError();
      if (extra?.clerkUserId && !cookie.clerk_user_id) {
        await db`UPDATE students SET clerk_user_id = ${extra.clerkUserId}
          WHERE id = ${cookie.id} AND academy_id = ${academyId} AND clerk_user_id IS NULL`;
        return { ...cookie, clerk_user_id: extra.clerkUserId };
      }
      return cookie;
    }
  }
  const trimmedPhone = phone.trim();
  if (trimmedPhone && !extra?.clerkUserId) {
    const [existing] = await db`SELECT * FROM students WHERE academy_id = ${academyId} AND phone = ${trimmedPhone}`;
    if (existing) {
      const row = studentFrom(existing as unknown as Parameters<typeof studentFrom>[0]);
      if (row.clerk_user_id) throw new ClaimedFichaError();
    }
  }
  return findOrCreateStudent(db, academyId, name, phone, extra);
}

async function publicBookIn(
  db: Db,
  academyId: string,
  sessionId: string,
  name: string,
  phone: string,
  extra?: {
    category?: StudentCategory;
    side?: PlayingSide | null;
    clerkUserId?: string | null;
    cookieToken?: string | null;
    cookieStudentId?: string | null;
    offeringId?: string | null;
  },
): Promise<{ status: BookingStatus; student: Student; sessionId: string; bookingId: string; manageToken: string }> {
  const academy = await academyById(db, academyId);
  const open = parseOpenSlotId(sessionId);
  let realId = sessionId;
  if (open) {
    // Serialize this hole for the length of the transaction. Without it two
    // players both read "libre" and both create a session on the same hour.
    await db`SELECT pg_advisory_xact_lock(hashtext(${`${academyId}:${open.coachId}:${open.startsAt.toISOString()}`}))`;
    const weekday = weekdayIn(academy.timezone, open.startsAt);
    const hour = timeIn(academy.timezone, open.startsAt);
    const covered = (await db`
      SELECT start_time, end_time FROM coach_availability
      WHERE academy_id = ${academyId} AND coach_id = ${open.coachId} AND location_id = ${open.locationId} AND weekday = ${weekday}
    `) as unknown as { start_time: string; end_time: string }[];
    if (!covered.some((b) => hoursInRange(b.start_time, b.end_time).includes(hour))) {
      throw new Error("Ese horario no está en la planilla madre");
    }
    const existing = await getSessionIn(db, academy, sessionId);
    if (existing && existing.source !== "availability") {
      if (extra?.offeringId && extra.offeringId !== existing.offering_id) {
        throw new Error(existing.offering_name === "Individual" ? "Esa hora ya es individual" : "Esa hora ya es grupal");
      }
      realId = existing.id;
    } else {
      const offeringId = extra?.offeringId ?? "";
      const [off] = await db`SELECT id, capacity FROM offerings WHERE id = ${offeringId} AND academy_id = ${academyId}`;
      if (!off || num(off.capacity) < 1) {
        throw new Error("Elegí el tipo de clase");
      }
      const ends = slotEnds(open.startsAt);
      const courtId = await firstFreeCourt(db, academyId, open.locationId, open.startsAt, ends);
      realId = await createSession(db, academyId, {
        offeringId,
        courtId,
        coachId: open.coachId,
        startsAt: open.startsAt,
      });
    }
  }
  const [session] = await db`SELECT starts_at, cancelled FROM sessions WHERE id = ${realId} AND academy_id = ${academyId}`;
  if (!session || flag(session.cancelled)) throw new Error("Sesión inexistente o cancelada");
  const startsAt = new Date(iso(session.starts_at));
  if (startsAt < new Date()) throw new Error("Ese horario ya pasó");
  if (!selfServeOpen(startsAt, academy.cutoff_hours)) throw new Error(cutoffMessage(academy.cutoff_hours));
  const student = await resolveBookerStudent(db, academyId, name, phone, extra);
  await assertBookingQuota(db, academyId, student.id);
  const status = await bookStudentIn(db, academyId, realId, student.id, "web");
  const [row] = await db`
    SELECT id, manage_token FROM bookings WHERE session_id = ${realId} AND student_id = ${student.id}
  `;
  return {
    status,
    student,
    sessionId: realId,
    bookingId: String(row?.id ?? ""),
    manageToken: String(row?.manage_token ?? ""),
  };
}

/**
 * Public booking, start to finish, in one transaction: the hole is locked, the
 * session row is locked, and nothing is written unless every step passes.
 */
export async function publicBook(
  db: Db,
  academyId: string,
  sessionId: string,
  name: string,
  phone: string,
  extra?: {
    category?: StudentCategory;
    side?: PlayingSide | null;
    clerkUserId?: string | null;
    cookieToken?: string | null;
    cookieStudentId?: string | null;
    offeringId?: string | null;
  },
): Promise<{ status: BookingStatus; student: Student; sessionId: string; bookingId: string; manageToken: string }> {
  return db.begin(async (raw) => publicBookIn(raw as unknown as Db, academyId, sessionId, name, phone, extra));
}

export async function buyPack(
  db: Db,
  studentId: string,
  offeringKind: ClassPack["offeringKind"],
  size: PackSize = 10,
  at = new Date(),
): Promise<ClassPack> {
  const pack = newPack({
    id: crypto.randomUUID(),
    studentId,
    offeringKind,
    size,
    purchasedAt: at,
  });
  await db`
    INSERT INTO packs (id, student_id, offering_kind, size, remaining, purchased_at, expires_at)
    VALUES (${pack.id}, ${pack.studentId}, ${pack.offeringKind}, ${pack.size}, ${pack.remaining}, ${pack.purchasedAt}, ${pack.expiresAt})
  `;
  return pack;
}

function packFromRow(row: {
  id: string;
  student_id: string;
  offering_kind: ClassPack["offeringKind"];
  size: PackSize;
  remaining: number;
  purchased_at: Date | string;
  expires_at: Date | string;
}): ClassPack {
  return {
    id: row.id,
    studentId: row.student_id,
    offeringKind: row.offering_kind,
    size: Number(row.size) as PackSize,
    remaining: num(row.remaining),
    purchasedAt: new Date(row.purchased_at),
    expiresAt: new Date(row.expires_at),
  };
}

export async function activePack(
  db: Db,
  studentId: string,
  kind: ClassPack["offeringKind"],
  at = new Date(),
): Promise<ClassPack | null> {
  const [row] = await db`
    SELECT * FROM packs
    WHERE student_id = ${studentId} AND offering_kind = ${kind} AND remaining > 0 AND expires_at >= ${at}
    ORDER BY purchased_at
    LIMIT 1
  `;
  return row ? packFromRow(row as unknown as Parameters<typeof packFromRow>[0]) : null;
}

async function saveAlert(db: Db, alert: PackAlert, at: Date): Promise<void> {
  await db`
    INSERT INTO pack_alerts (id, student_id, pack_id, remaining, total, buy_again, message, created_at)
    VALUES (${crypto.randomUUID()}, ${alert.studentId}, ${alert.packId}, ${alert.remaining}, ${alert.total}, ${alert.buyAgain}, ${alert.message}, ${at})
  `;
}

export async function studentAlerts(
  db: Db,
  studentId: string,
): Promise<{ message: string; remaining: number; buy_again: number }[]> {
  const rows = await db`
    SELECT message, remaining, buy_again FROM pack_alerts WHERE student_id = ${studentId} ORDER BY created_at
  `;
  return rows.map((row) => ({
    message: String(row.message),
    remaining: num(row.remaining),
    buy_again: flag(row.buy_again),
  }));
}

export async function setBookingStatus(
  db: Db,
  academyId: string,
  bookingId: string,
  status: BookingStatus,
): Promise<PackAlert | null> {
  return db.begin(async (raw) => setBookingStatusIn(raw as unknown as Db, academyId, bookingId, status));
}

async function setBookingStatusIn(
  db: Db,
  academyId: string,
  bookingId: string,
  status: BookingStatus,
): Promise<PackAlert | null> {
  const [booking] = await db`
    SELECT b.id, b.session_id, b.student_id, b.status, b.pack_id
    FROM bookings b
    JOIN sessions s ON s.id = b.session_id
    WHERE b.id = ${bookingId} AND s.academy_id = ${academyId}
  `;
  if (!booking) throw new Error("Reserva inexistente");
  if (status === "cancelled") {
    await applyCancel(db, academyId, booking as unknown as Parameters<typeof applyCancel>[2], false);
    return null;
  }
  if (status !== "confirmed" || booking.status === "confirmed") {
    await db`UPDATE bookings SET status = ${status} WHERE id = ${bookingId}`;
    return null;
  }
  const [session] = await db`SELECT capacity FROM sessions WHERE id = ${booking.session_id as string} AND academy_id = ${academyId}`;
  if (!session) throw new Error("Sesión inexistente");
  const kind = offeringKindFromCapacity(num(session.capacity));
  const pack = await activePack(db, String(booking.student_id), kind);
  if (!pack) {
    await db`UPDATE bookings SET status = ${status} WHERE id = ${bookingId}`;
    return null;
  }
  const now = new Date();
  const { pack: next, alert } = consumeOnConfirm(pack, now, kind);
  await db`UPDATE packs SET remaining = ${next.remaining} WHERE id = ${next.id}`;
  await db`UPDATE bookings SET status = ${status}, pack_id = ${next.id} WHERE id = ${bookingId}`;
  await saveAlert(db, alert, now);
  return alert;
}

async function selfServeCancelIn(db: Db, academyId: string, bookingId: string, studentId: string): Promise<void> {
  const [booking] = await db`
    SELECT b.id, b.session_id, b.student_id, b.status, b.pack_id
    FROM bookings b
    JOIN sessions s ON s.id = b.session_id
    WHERE b.id = ${bookingId} AND s.academy_id = ${academyId} AND b.student_id = ${studentId}
  `;
  if (!booking) throw new Error("Reserva inexistente");
  await applyCancel(db, academyId, booking as unknown as Parameters<typeof applyCancel>[2], true);
}

export async function selfServeCancel(db: Db, academyId: string, bookingId: string, studentId: string): Promise<void> {
  await db.begin(async (raw) => selfServeCancelIn(raw as unknown as Db, academyId, bookingId, studentId));
}

export async function dueReminders(db: Db, now = new Date()): Promise<ReminderDue[]> {
  const until = new Date(now.getTime() + 24 * 3_600_000);
  const rows = await db`
    SELECT b.id, b.manage_token, a.id AS academy_id, a.slug, a.cutoff_hours, a.timezone, st.phone, s.starts_at,
      o.name AS offering_name, ch.name AS coach_name, l.name AS location_name
    FROM bookings b
    JOIN sessions s ON s.id = b.session_id
    JOIN students st ON st.id = b.student_id
    JOIN academy a ON a.id = s.academy_id
    JOIN offerings o ON o.id = s.offering_id
    JOIN coaches ch ON ch.id = s.coach_id
    JOIN locations l ON l.id = s.location_id
    WHERE b.reminded_at IS NULL
      AND b.reminder_attempts < ${MAX_REMINDER_ATTEMPTS}
      AND b.status IN ('pending_payment', 'confirmed', 'checked_in')
      AND s.cancelled = false
      AND s.starts_at > ${now}
      AND s.starts_at <= ${until}
    ORDER BY s.starts_at
  `;
  return rows.map((row) => ({
    id: String(row.id),
    manage_token: String(row.manage_token),
    academy_id: String(row.academy_id),
    slug: String(row.slug),
    phone: String(row.phone),
    starts_at: iso(row.starts_at),
    offering_name: String(row.offering_name),
    coach_name: String(row.coach_name),
    location_name: String(row.location_name),
    cutoff_hours: Number(row.cutoff_hours) || 12,
    timezone: isValidTimeZone(String(row.timezone ?? "")) ? String(row.timezone) : DEFAULT_TIMEZONE,
  }));
}

export async function markReminded(db: Db, bookingId: string): Promise<boolean> {
  const rows = await db`
    UPDATE bookings SET reminded_at = now(), reminder_attempts = reminder_attempts + 1
    WHERE id = ${bookingId} AND reminded_at IS NULL
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * A send that did not reach the player. Counting it stops the 60s tick from
 * retrying the same failing number until the class starts.
 */
export async function markReminderFailed(db: Db, bookingId: string): Promise<number> {
  const [row] = await db`
    UPDATE bookings SET reminder_attempts = reminder_attempts + 1
    WHERE id = ${bookingId}
    RETURNING reminder_attempts
  `;
  return num(row?.reminder_attempts);
}

export type ExpiredHold = {
  booking_id: string;
  slug: string;
  name: string;
  phone: string;
  starts_at: string;
  offering_name: string;
  timezone: string;
};

/**
 * Release unpaid web holds after `academy.hold_minutes`, so one player cannot
 * sit on a cupo forever. Off (0) unless the academia turns it on.
 */
export async function expireStaleHolds(db: Db, now = new Date()): Promise<ExpiredHold[]> {
  const rows = await db`
    SELECT b.id, b.session_id, b.student_id, b.status, b.pack_id, s.academy_id, s.starts_at,
      a.slug, a.timezone, st.name, st.phone, o.name AS offering_name
    FROM bookings b
    JOIN sessions s ON s.id = b.session_id
    JOIN academy a ON a.id = s.academy_id
    JOIN students st ON st.id = b.student_id
    JOIN offerings o ON o.id = s.offering_id
    WHERE a.hold_minutes > 0
      AND b.status = 'pending_payment'
      AND b.channel = 'web'
      AND s.cancelled = false
      AND s.starts_at > ${now}
      AND b.created_at < ${now} - (a.hold_minutes * INTERVAL '1 minute')
  `;
  const out: ExpiredHold[] = [];
  for (const row of rows) {
    const academyId = String(row.academy_id);
    const released = await db.begin(async (raw) => {
      const tx = raw as unknown as Db;
      // Re-read under the lock: the academia may have marked this one paid
      // between the scan and now, and a stale row would restore a pack class
      // that was never given back.
      const [fresh] = await tx`
        SELECT id, session_id, student_id, status, pack_id FROM bookings
        WHERE id = ${String(row.id)} AND status = 'pending_payment'
        FOR UPDATE
      `;
      if (!fresh) return false;
      await applyCancel(tx, academyId, fresh as unknown as Parameters<typeof applyCancel>[2], false, {
        restorePack: true,
      });
      return true;
    });
    if (!released) continue;
    out.push({
      booking_id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      phone: String(row.phone),
      starts_at: iso(row.starts_at),
      offering_name: String(row.offering_name),
      timezone: isValidTimeZone(String(row.timezone ?? "")) ? String(row.timezone) : DEFAULT_TIMEZONE,
    });
  }
  return out;
}

const MANAGE_SELECT = `
  SELECT b.id, b.session_id, b.student_id, b.status, b.manage_token, s.starts_at, s.ends_at, s.offering_id,
    o.name AS offering_name, ch.name AS coach_name, l.name AS location_name, c.name AS court_name
  FROM bookings b
  JOIN sessions s ON s.id = b.session_id
  JOIN offerings o ON o.id = s.offering_id
  JOIN coaches ch ON ch.id = s.coach_id
  JOIN locations l ON l.id = s.location_id
  JOIN courts c ON c.id = s.court_id
`;

/** The link a player opens: an opaque token, scoped to its own academia. */
export async function manageBookingByToken(db: Db, academyId: string, token: string): Promise<ManageBooking | null> {
  if (!token) return null;
  const [row] = await db.unsafe(`${MANAGE_SELECT} WHERE b.manage_token = $1 AND s.academy_id = $2`, [token, academyId]);
  return row ? manageFrom(db, academyId, row as Record<string, unknown>) : null;
}

export async function manageBooking(db: Db, academyId: string, bookingId: string): Promise<ManageBooking | null> {
  const [row] = await db.unsafe(`${MANAGE_SELECT} WHERE b.id = $1 AND s.academy_id = $2`, [bookingId, academyId]);
  return row ? manageFrom(db, academyId, row as Record<string, unknown>) : null;
}

async function manageFrom(db: Db, academyId: string, row: Record<string, unknown>): Promise<ManageBooking> {
  const ac = await academyById(db, academyId);
  const starts = new Date(iso(row.starts_at));
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    manage_token: String(row.manage_token),
    student_id: String(row.student_id),
    status: row.status as BookingStatus,
    starts_at: iso(row.starts_at),
    ends_at: iso(row.ends_at),
    local_date: dateKeyIn(ac.timezone, starts),
    local_time: timeIn(ac.timezone, starts),
    time_zone: ac.timezone,
    offering_name: String(row.offering_name),
    offering_id: String(row.offering_id),
    coach_name: String(row.coach_name),
    location_name: String(row.location_name),
    court_name: String(row.court_name),
    can_change: row.status !== "cancelled" && selfServeOpen(starts, ac.cutoff_hours),
  };
}

/**
 * Move a booking. One transaction, so a failure to release the old class can
 * never leave the player holding two cupos.
 */
export async function selfServeReschedule(
  db: Db,
  academyId: string,
  bookingId: string,
  studentId: string,
  newSessionId: string,
  offeringId?: string | null,
): Promise<{ status: BookingStatus; sessionId: string }> {
  return db.begin(async (raw) => {
    const tx = raw as unknown as Db;
    const current = await manageBooking(tx, academyId, bookingId);
    if (!current || current.student_id !== studentId) throw new Error("Reserva inexistente");
    if (!current.can_change) throw new Error(cutoffMessage((await academyById(tx, academyId)).cutoff_hours));
    if (current.session_id === newSessionId) return { status: current.status, sessionId: current.session_id };
    const student = await studentById(tx, academyId, studentId);
    if (!student) throw new Error("Alumno inexistente");
    // Release first: otherwise the old booking still counts against the quota
    // and against the cupo when moving inside the same class.
    await selfServeCancelIn(tx, academyId, bookingId, studentId);
    const booked = await publicBookIn(tx, academyId, newSessionId, student.name, student.phone, {
      cookieToken: student.cookie_token,
      clerkUserId: student.clerk_user_id,
      offeringId: offeringId ?? null,
    });
    return { status: booked.status, sessionId: booked.sessionId };
  });
}

async function applyCancel(
  db: Db,
  academyId: string,
  booking: { id: unknown; session_id: unknown; student_id: unknown; status: unknown; pack_id: unknown },
  selfServe: boolean,
  opts: { restorePack?: boolean } = {},
): Promise<void> {
  if (booking.status === "cancelled") return;
  const [session] = await db`SELECT starts_at FROM sessions WHERE id = ${booking.session_id as string} AND academy_id = ${academyId}`;
  if (!session) throw new Error("Sesión inexistente");
  const ac = await academyById(db, academyId);
  const open = selfServeOpen(new Date(iso(session.starts_at)), ac.cutoff_hours);
  if (selfServe && !open) throw new Error(cutoffMessage(ac.cutoff_hours));
  const occupying = OCCUPYING_BOOKING_STATUSES.has(booking.status as BookingStatus);
  const packId = booking.pack_id as string | null;
  if (occupying && packId && (opts.restorePack ?? open)) {
    const [row] = await db`SELECT * FROM packs WHERE id = ${packId}`;
    if (row) {
      const next = restoreOnCancel(packFromRow(row as unknown as Parameters<typeof packFromRow>[0]));
      await db`UPDATE packs SET remaining = ${next.remaining} WHERE id = ${next.id}`;
    }
  }
  await db`UPDATE bookings SET status = ${"cancelled"} WHERE id = ${booking.id as string}`;
}

export async function studentHistory(db: Db, academyId: string, studentId: string): Promise<PlayerBooking[]> {
  const academy = await academyById(db, academyId);
  const rows = await db`
    SELECT b.id, b.session_id, b.status, b.manage_token, s.starts_at, s.ends_at,
      o.name AS offering_name, ch.name AS coach_name, l.name AS location_name, c.name AS court_name
    FROM bookings b
    JOIN sessions s ON s.id = b.session_id
    JOIN offerings o ON o.id = s.offering_id
    JOIN coaches ch ON ch.id = s.coach_id
    JOIN locations l ON l.id = s.location_id
    JOIN courts c ON c.id = s.court_id
    WHERE b.student_id = ${studentId} AND s.academy_id = ${academyId}
    ORDER BY s.starts_at DESC
  `;
  return rows.map((row) => {
    const starts = new Date(iso(row.starts_at));
    return {
      id: String(row.id),
      session_id: String(row.session_id),
      manage_token: String(row.manage_token),
      status: row.status as BookingStatus,
      starts_at: iso(row.starts_at),
      ends_at: iso(row.ends_at),
      local_date: dateKeyIn(academy.timezone, starts),
      local_time: timeIn(academy.timezone, starts),
      time_zone: academy.timezone,
      offering_name: String(row.offering_name),
      coach_name: String(row.coach_name),
      location_name: String(row.location_name),
      court_name: String(row.court_name),
    };
  });
}

export async function ensureAcademyFromOrg(
  db: Db,
  input: { orgId: string; orgSlug: string; name: string },
): Promise<Academy> {
  const existing = await academyByClerkOrg(db, input.orgId);
  if (existing) return existing;
  const slug = parseSlug(input.orgSlug);
  const bySlug = await academyBySlug(db, slug);
  if (bySlug) {
    if (bySlug.clerk_org_id && bySlug.clerk_org_id !== input.orgId) {
      throw new Error("Ese slug ya está en uso.");
    }
    await db`UPDATE academy SET clerk_org_id = ${input.orgId} WHERE id = ${bySlug.id}`;
    return { ...bySlug, clerk_org_id: input.orgId };
  }
  const academy: Academy = {
    id: `academy-${slug}`,
    slug,
    name: input.name.trim() || slug,
    locale: "es-PY",
    currency: "PYG",
    timezone: DEFAULT_TIMEZONE,
    cutoff_hours: DEFAULT_CUTOFF_HOURS,
    hold_minutes: 0,
    clerk_org_id: input.orgId,
  };
  await db`
    INSERT INTO academy (id, slug, name, locale, currency, timezone, cutoff_hours, hold_minutes, clerk_org_id)
    VALUES (${academy.id}, ${academy.slug}, ${academy.name}, ${academy.locale}, ${academy.currency}, ${academy.timezone}, ${academy.cutoff_hours}, ${academy.hold_minutes}, ${academy.clerk_org_id})
  `;
  // Without an offering the booker cannot turn a hole into a class, so a new
  // academia starts with the two the engine supports.
  await db`
    INSERT INTO offerings (id, academy_id, name, duration_minutes, capacity, price) VALUES
      (${`off-${slug}-individual`}, ${academy.id}, 'Individual', 60, 1, 0),
      (${`off-${slug}-grupal`}, ${academy.id}, 'Grupal', 60, 4, 0)
    ON CONFLICT (id) DO NOTHING
  `;
  return academy;
}

export { OverlapError, mondayOf, dateKey, addDays };

export type TemplateView = {
  id: string;
  offering_id: string;
  offering_name: string;
  location_id: string;
  location_name: string;
  court_id: string;
  court_name: string;
  coach_id: string;
  coach_name: string;
  weekday: DayOfWeek;
  start_time: string;
  end_time: string;
};

export async function listTemplates(db: Db, academyId: string): Promise<TemplateView[]> {
  const rows = await db`
    SELECT t.id, t.offering_id, o.name AS offering_name, t.location_id, l.name AS location_name,
      t.court_id, c.name AS court_name, t.coach_id, ch.name AS coach_name, t.weekday, t.start_time, t.end_time
    FROM templates t
    JOIN offerings o ON o.id = t.offering_id
    JOIN locations l ON l.id = t.location_id
    JOIN courts c ON c.id = t.court_id
    JOIN coaches ch ON ch.id = t.coach_id
    WHERE t.academy_id = ${academyId}
    ORDER BY ch.name, t.weekday, t.start_time
  `;
  return rows as unknown as TemplateView[];
}

export async function createTemplate(
  db: Db,
  academyId: string,
  input: {
    offeringId: string;
    locationId: string;
    courtId: string;
    coachId: string;
    weekday: DayOfWeek;
    startTime: string;
  },
): Promise<string> {
  const [off] = await db`SELECT duration_minutes FROM offerings WHERE id = ${input.offeringId} AND academy_id = ${academyId}`;
  if (!off) throw new Error("Offering inexistente");
  const [court] = await db`
    SELECT id FROM courts
    WHERE id = ${input.courtId} AND academy_id = ${academyId} AND location_id = ${input.locationId}
  `;
  if (!court) throw new Error("Esa cancha no es de esa sede");
  const [coach] = await db`SELECT id FROM coaches WHERE id = ${input.coachId} AND academy_id = ${academyId}`;
  if (!coach) throw new Error("Entrenador inexistente");
  const weekday = parseWeekday(input.weekday);
  const startTime = parseTimeOfDay(input.startTime);
  const endTime = timeOfMinutes(minutesOfTime(startTime) + num(off.duration_minutes));
  if (minutesOfTime(endTime) > 24 * 60) throw new Error("La clase termina después de medianoche");
  // A clashing row would silently never materialize, so refuse it here.
  const clash = (await listTemplates(db, academyId)).find(
    (t) =>
      t.weekday === weekday &&
      (t.court_id === input.courtId || t.coach_id === input.coachId) &&
      minutesOfTime(startTime) < minutesOfTime(t.end_time) &&
      minutesOfTime(t.start_time) < minutesOfTime(endTime),
  );
  if (clash) {
    const who = clash.court_id === input.courtId ? clash.court_name : clash.coach_name;
    throw new Error(`Se solapa con ${clash.start_time}–${clash.end_time} (${who})`);
  }
  const id = `tpl-${crypto.randomUUID().slice(0, 8)}`;
  await db`
    INSERT INTO templates (id, academy_id, offering_id, location_id, court_id, coach_id, weekday, start_time, end_time)
    VALUES (${id}, ${academyId}, ${input.offeringId}, ${input.locationId}, ${input.courtId}, ${input.coachId}, ${weekday}, ${startTime}, ${endTime})
  `;
  return id;
}

export async function deleteTemplate(db: Db, academyId: string, id: string): Promise<void> {
  await db`DELETE FROM templates WHERE id = ${id} AND academy_id = ${academyId}`;
}

// ---------------------------------------------------------------------------
// Catalog and availability, editable by the academia.
//
// This used to live only in `seed.ts`, which meant onboarding an academy or
// moving a coach's hours needed a code change and a deploy.
// ---------------------------------------------------------------------------

export type AvailabilityView = {
  id: string;
  coach_id: string;
  coach_name: string;
  location_id: string;
  location_name: string;
  weekday: DayOfWeek;
  start_time: string;
  end_time: string;
};

export async function listAvailability(db: Db, academyId: string): Promise<AvailabilityView[]> {
  const rows = await db`
    SELECT av.id, av.coach_id, ch.name AS coach_name, av.location_id, l.name AS location_name,
      av.weekday, av.start_time, av.end_time
    FROM coach_availability av
    JOIN coaches ch ON ch.id = av.coach_id
    JOIN locations l ON l.id = av.location_id
    WHERE av.academy_id = ${academyId}
    ORDER BY ch.name, av.weekday, av.start_time
  `;
  return rows.map((row) => ({
    id: String(row.id),
    coach_id: String(row.coach_id),
    coach_name: String(row.coach_name),
    location_id: String(row.location_id),
    location_name: String(row.location_name),
    weekday: row.weekday as DayOfWeek,
    start_time: String(row.start_time).slice(0, 5),
    end_time: String(row.end_time).slice(0, 5),
  }));
}

export async function createAvailability(
  db: Db,
  academyId: string,
  input: { coachId: string; locationId: string; weekday: string; startTime: string; endTime: string },
): Promise<string> {
  const [coach] = await db`SELECT id FROM coaches WHERE id = ${input.coachId} AND academy_id = ${academyId}`;
  if (!coach) throw new Error("Entrenador inexistente");
  const [location] = await db`SELECT id FROM locations WHERE id = ${input.locationId} AND academy_id = ${academyId}`;
  if (!location) throw new Error("Sede inexistente");
  const weekday = parseWeekday(input.weekday);
  const startTime = parseTimeOfDay(input.startTime);
  const endTime = parseTimeOfDay(input.endTime, { allowEndOfDay: true });
  if (minutesOfTime(endTime) - minutesOfTime(startTime) < 60) {
    throw new Error("El bloque tiene que durar al menos una hora");
  }
  const block: AvailabilityBlock = { coachId: input.coachId, locationId: input.locationId, weekday, startTime, endTime };
  const existing = await listAvailability(db, academyId);
  const clash = existing.find(
    (row) =>
      row.coach_id === input.coachId &&
      blocksOverlap(block, {
        coachId: row.coach_id,
        locationId: row.location_id,
        weekday: row.weekday,
        startTime: row.start_time,
        endTime: row.end_time,
      }),
  );
  if (clash) {
    throw new Error(`Ese profe ya está en ${clash.location_name} de ${clash.start_time} a ${clash.end_time}`);
  }
  const id = shortId("av");
  await db`
    INSERT INTO coach_availability (id, academy_id, coach_id, location_id, weekday, start_time, end_time)
    VALUES (${id}, ${academyId}, ${input.coachId}, ${input.locationId}, ${weekday}, ${startTime}, ${endTime})
  `;
  return id;
}

export async function deleteAvailability(db: Db, academyId: string, id: string): Promise<void> {
  await db`DELETE FROM coach_availability WHERE id = ${id} AND academy_id = ${academyId}`;
}

export type AvailabilityInput = {
  locationId: string;
  weekday: string;
  startTime: string;
  endTime: string;
};

/**
 * Replace one coach's whole week at once.
 *
 * The grid editor sends the week it wants rather than a stream of per-cell
 * writes: a half-applied roster is worse than a rejected save, and the coach
 * cannot be in two sedes at the same hour so the set has to be validated as a
 * whole anyway.
 */
export async function replaceCoachAvailability(
  db: Db,
  academyId: string,
  coachId: string,
  blocks: readonly AvailabilityInput[],
): Promise<AvailabilityView[]> {
  const [coach] = await db`SELECT id FROM coaches WHERE id = ${coachId} AND academy_id = ${academyId}`;
  if (!coach) throw new Error("Entrenador inexistente");
  const locations = (await db`SELECT id FROM locations WHERE academy_id = ${academyId}`) as unknown as { id: string }[];
  const known = new Set(locations.map((l) => l.id));

  const clean: AvailabilityBlock[] = blocks.map((raw) => {
    if (!known.has(raw.locationId)) throw new Error("Sede inexistente");
    const startTime = parseTimeOfDay(raw.startTime);
    const endTime = parseTimeOfDay(raw.endTime, { allowEndOfDay: true });
    if (minutesOfTime(endTime) - minutesOfTime(startTime) < 60) {
      throw new Error(`La franja ${startTime}–${endTime} no llega a una hora`);
    }
    return {
      coachId,
      locationId: raw.locationId,
      weekday: parseWeekday(raw.weekday),
      startTime,
      endTime,
    };
  });

  for (let i = 0; i < clean.length; i++) {
    for (let j = i + 1; j < clean.length; j++) {
      if (blocksOverlap(clean[i], clean[j])) {
        throw new Error(
          `El profe no puede estar en dos lados a la vez: ${clean[i].weekday} ${clean[i].startTime}–${clean[i].endTime} choca con ${clean[j].startTime}–${clean[j].endTime}`,
        );
      }
    }
  }

  await db.begin(async (raw) => {
    const tx = raw as unknown as Db;
    await tx`DELETE FROM coach_availability WHERE academy_id = ${academyId} AND coach_id = ${coachId}`;
    for (const block of clean) {
      await tx`
        INSERT INTO coach_availability (id, academy_id, coach_id, location_id, weekday, start_time, end_time)
        VALUES (${shortId("av")}, ${academyId}, ${coachId}, ${block.locationId}, ${block.weekday},
          ${block.startTime}, ${block.endTime})
      `;
    }
  });
  return listAvailability(db, academyId);
}

async function assertNoLiveSessions(db: Db, where: "court_id" | "coach_id" | "offering_id" | "location_id", id: string, label: string): Promise<void> {
  const [row] = await db.unsafe(
    `SELECT COUNT(*)::int AS n FROM sessions WHERE ${where} = $1 AND cancelled = false AND starts_at > now()`,
    [id],
  );
  if (num((row as unknown as { n: number }).n) > 0) {
    throw new Error(`No se puede borrar: ${label} tiene clases por delante. Cancelalas primero.`);
  }
}

export async function createLocation(
  db: Db,
  academyId: string,
  input: { name: string; address?: string | null; mapsUrl?: string | null; imageUrl?: string | null },
): Promise<string> {
  const id = shortId("loc");
  await db`
    INSERT INTO locations (id, academy_id, name, address, maps_url, image_url)
    VALUES (${id}, ${academyId}, ${requiredText(input.name, "el nombre de la sede")},
      ${optionalText(input.address, "la dirección", 200)}, ${optionalText(input.mapsUrl, "el link de Maps")},
      ${optionalText(input.imageUrl, "la imagen")})
  `;
  return id;
}

export async function updateLocation(
  db: Db,
  academyId: string,
  id: string,
  patch: { name?: string; address?: string | null; mapsUrl?: string | null; imageUrl?: string | null },
): Promise<void> {
  const [row] = await db`SELECT * FROM locations WHERE id = ${id} AND academy_id = ${academyId}`;
  if (!row) throw new Error("Sede inexistente");
  const current = row as unknown as Location;
  await db`
    UPDATE locations SET
      name = ${patch.name === undefined ? current.name : requiredText(patch.name, "el nombre de la sede")},
      address = ${patch.address === undefined ? current.address : optionalText(patch.address, "la dirección", 200)},
      maps_url = ${patch.mapsUrl === undefined ? current.maps_url : optionalText(patch.mapsUrl, "el link de Maps")},
      image_url = ${patch.imageUrl === undefined ? current.image_url : optionalText(patch.imageUrl, "la imagen")}
    WHERE id = ${id} AND academy_id = ${academyId}
  `;
}

export async function deleteLocation(db: Db, academyId: string, id: string): Promise<void> {
  const [court] = await db`SELECT id FROM courts WHERE location_id = ${id} AND academy_id = ${academyId} LIMIT 1`;
  if (court) throw new Error("No se puede borrar: la sede todavía tiene canchas.");
  await assertNoLiveSessions(db, "location_id", id, "la sede");
  await db`DELETE FROM coach_availability WHERE location_id = ${id} AND academy_id = ${academyId}`;
  await db`DELETE FROM locations WHERE id = ${id} AND academy_id = ${academyId}`;
}

export async function createCourt(
  db: Db,
  academyId: string,
  input: { locationId: string; name: string; number?: number | string },
): Promise<string> {
  const [location] = await db`SELECT id FROM locations WHERE id = ${input.locationId} AND academy_id = ${academyId}`;
  if (!location) throw new Error("Sede inexistente");
  const [last] = await db`
    SELECT COALESCE(MAX(number), 0) AS n FROM courts WHERE academy_id = ${academyId} AND location_id = ${input.locationId}
  `;
  const raw = input.number === undefined || input.number === "" ? num(last?.n) + 1 : Number(input.number);
  if (!Number.isInteger(raw) || raw < 1 || raw > 99) throw new Error("Número de cancha inválido (1–99)");
  const id = shortId("court");
  await db`
    INSERT INTO courts (id, academy_id, location_id, name, number)
    VALUES (${id}, ${academyId}, ${input.locationId}, ${requiredText(input.name, "el nombre de la cancha", 40)}, ${raw})
  `;
  return id;
}

export async function deleteCourt(db: Db, academyId: string, id: string): Promise<void> {
  const [row] = await db`SELECT id FROM courts WHERE id = ${id} AND academy_id = ${academyId}`;
  if (!row) throw new Error("Cancha inexistente");
  await assertNoLiveSessions(db, "court_id", id, "la cancha");
  const [used] = await db`SELECT id FROM templates WHERE court_id = ${id} AND academy_id = ${academyId} LIMIT 1`;
  if (used) throw new Error("No se puede borrar: la cancha está en la planilla madre.");
  await db`DELETE FROM courts WHERE id = ${id} AND academy_id = ${academyId}`;
}

function parseLanguages(raw: string[] | string | null | undefined): string[] {
  const list = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,\s]+/);
  const out: string[] = [];
  for (const item of list) {
    const code = item.trim().toLowerCase();
    if (!code) continue;
    if (!/^[a-z]{2}$/.test(code)) throw new Error(`Idioma inválido: ${item}. Usá códigos de dos letras (es, en, pt, gn).`);
    if (!out.includes(code)) out.push(code);
  }
  return out;
}

export async function createCoach(
  db: Db,
  academyId: string,
  input: { name: string; bio?: string | null; languages?: string[] | string | null },
): Promise<string> {
  const id = shortId("coach");
  await db`
    INSERT INTO coaches (id, academy_id, name, bio, languages)
    VALUES (${id}, ${academyId}, ${requiredText(input.name, "el nombre del profe")},
      ${optionalText(input.bio, "la bio", 600)}, ${parseLanguages(input.languages ?? ["es"])})
  `;
  return id;
}

export async function updateCoach(
  db: Db,
  academyId: string,
  id: string,
  patch: { name?: string; bio?: string | null; languages?: string[] | string | null },
): Promise<void> {
  const [row] = await db`SELECT id, name, bio, languages FROM coaches WHERE id = ${id} AND academy_id = ${academyId}`;
  if (!row) throw new Error("Entrenador inexistente");
  const name = patch.name === undefined ? String(row.name) : requiredText(patch.name, "el nombre del profe");
  const bio = patch.bio === undefined ? (row.bio as string | null) : optionalText(patch.bio, "la bio", 600);
  const languages = patch.languages === undefined ? ((row.languages as string[] | null) ?? []) : parseLanguages(patch.languages);
  await db`UPDATE coaches SET name = ${name}, bio = ${bio}, languages = ${languages} WHERE id = ${id} AND academy_id = ${academyId}`;
}

export async function deleteCoach(db: Db, academyId: string, id: string): Promise<void> {
  const [row] = await db`SELECT id FROM coaches WHERE id = ${id} AND academy_id = ${academyId}`;
  if (!row) throw new Error("Entrenador inexistente");
  await assertNoLiveSessions(db, "coach_id", id, "el profe");
  const [used] = await db`SELECT id FROM templates WHERE coach_id = ${id} AND academy_id = ${academyId} LIMIT 1`;
  if (used) throw new Error("No se puede borrar: el profe está en la planilla madre.");
  await db`DELETE FROM coach_availability WHERE coach_id = ${id} AND academy_id = ${academyId}`;
  await db`DELETE FROM coaches WHERE id = ${id} AND academy_id = ${academyId}`;
}

function parseOfferingNumbers(input: { durationMinutes?: number | string; capacity?: number | string; price?: number | string }) {
  const duration = Number(input.durationMinutes ?? 60);
  const capacity = Number(input.capacity ?? 1);
  const price = Number(input.price ?? 0);
  if (!Number.isInteger(duration) || duration < 15 || duration > 240 || duration % 5 !== 0) {
    throw new Error("Duración inválida: entre 15 y 240 minutos, múltiplo de 5");
  }
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 12) throw new Error("Cupo inválido (1–12)");
  if (!Number.isInteger(price) || price < 0) throw new Error("Precio inválido: entero en la moneda de la academia");
  return { duration, capacity, price };
}

export async function createOffering(
  db: Db,
  academyId: string,
  input: { name: string; durationMinutes?: number | string; capacity?: number | string; price?: number | string },
): Promise<string> {
  const { duration, capacity, price } = parseOfferingNumbers(input);
  const id = shortId("off");
  await db`
    INSERT INTO offerings (id, academy_id, name, duration_minutes, capacity, price)
    VALUES (${id}, ${academyId}, ${requiredText(input.name, "el nombre de la clase", 40)}, ${duration}, ${capacity}, ${price})
  `;
  return id;
}

export async function updateOffering(
  db: Db,
  academyId: string,
  id: string,
  patch: { name?: string; durationMinutes?: number | string; capacity?: number | string; price?: number | string },
): Promise<void> {
  const [row] = await db`SELECT * FROM offerings WHERE id = ${id} AND academy_id = ${academyId}`;
  if (!row) throw new Error("Offering inexistente");
  const current = row as unknown as Offering;
  const { duration, capacity, price } = parseOfferingNumbers({
    durationMinutes: patch.durationMinutes ?? current.duration_minutes,
    capacity: patch.capacity ?? current.capacity,
    price: patch.price ?? current.price,
  });
  const name = patch.name === undefined ? current.name : requiredText(patch.name, "el nombre de la clase", 40);
  await db`
    UPDATE offerings SET name = ${name}, duration_minutes = ${duration}, capacity = ${capacity}, price = ${price}
    WHERE id = ${id} AND academy_id = ${academyId}
  `;
}

export async function deleteOffering(db: Db, academyId: string, id: string): Promise<void> {
  const [row] = await db`SELECT id FROM offerings WHERE id = ${id} AND academy_id = ${academyId}`;
  if (!row) throw new Error("Offering inexistente");
  await assertNoLiveSessions(db, "offering_id", id, "esa clase");
  const [used] = await db`SELECT id FROM templates WHERE offering_id = ${id} AND academy_id = ${academyId} LIMIT 1`;
  if (used) throw new Error("No se puede borrar: la clase está en la planilla madre.");
  await db`DELETE FROM offerings WHERE id = ${id} AND academy_id = ${academyId}`;
}
