import type { DayOfWeek, SessionInterval } from "./domain/types";
import { assertNoOverlap } from "./domain/overlap";
import { nextBookingStatus } from "./domain/capacity";
import { dateKey, materializeTemplate, mondayOf, type WeeklyTemplateSlot } from "./domain/template";
import { addDays } from "./domain/template";
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
import { DAY_FROM_JS, OCCUPYING_BOOKING_STATUSES, type BookingStatus } from "./domain/types";
import { OverlapError } from "./domain/types";
import { cutoffMessage, DEFAULT_CUTOFF_HOURS, parseCutoffHours, selfServeOpen } from "./domain/cutoff";
import { hoursInRange, openSlotId, parseOpenSlotId, slotEnds, slotStarts } from "./domain/availability";
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
export type Coach = { id: string; name: string };
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
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  offering_name: string;
  coach_name: string;
  location_name: string;
  court_name: string;
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
  category: string;
  side: string | null;
}): Student {
  return {
    id: row.id,
    academy_id: row.academy_id,
    name: row.name,
    phone: row.phone,
    clerk_user_id: row.clerk_user_id ?? null,
    category: parseCategory(row.category),
    side: parseSide(row.side),
  };
}

function academyFrom(row: Record<string, unknown>): Academy {
  const hours = num(row.cutoff_hours);
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    locale: String(row.locale),
    currency: String(row.currency),
    timezone: String(row.timezone),
    cutoff_hours: hours > 0 ? hours : DEFAULT_CUTOFF_HOURS,
    clerk_org_id: row.clerk_org_id ? String(row.clerk_org_id) : null,
  };
}

function sessionFrom(row: Record<string, unknown>): SessionView {
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
    starts_at: iso(row.starts_at),
    ends_at: iso(row.ends_at),
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

export async function catalogs(db: Db, academyId: string) {
  const [locations, courts, coaches, offerings, students] = await Promise.all([
    db`SELECT * FROM locations WHERE academy_id = ${academyId} ORDER BY name`,
    db`SELECT * FROM courts WHERE academy_id = ${academyId} ORDER BY location_id, number`,
    db`SELECT * FROM coaches WHERE academy_id = ${academyId} ORDER BY name`,
    db`SELECT * FROM offerings WHERE academy_id = ${academyId} ORDER BY capacity`,
    db`SELECT * FROM students WHERE academy_id = ${academyId} ORDER BY name`,
  ]);
  return {
    locations: locations as Location[],
    courts: courts as Court[],
    coaches: coaches as Coach[],
    offerings: offerings as Offering[],
    students: (students as Parameters<typeof studentFrom>[0][]).map(studentFrom),
  };
}

function toInterval(row: {
  id: string;
  court_id: string;
  coach_id: string;
  starts_at: Date | string;
  ends_at: Date | string;
  cancelled: unknown;
}): SessionInterval {
  return {
    id: row.id,
    courtId: row.court_id,
    coachStaffId: row.coach_id,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    cancelled: flag(row.cancelled) === 1,
  };
}

export async function ensureWeek(db: Db, academyId: string, monday: Date): Promise<void> {
  const templates = await db`SELECT * FROM templates WHERE academy_id = ${academyId}`;
  const offerings = await db`SELECT id, capacity FROM offerings WHERE academy_id = ${academyId}`;
  const capacity = new Map((offerings as { id: string; capacity: number }[]).map((o) => [o.id, o.capacity]));
  const slots: WeeklyTemplateSlot[] = (
    templates as {
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
  const to = addDays(mondayOf(monday), 7);
  const materialized = materializeTemplate(slots, { from: mondayOf(monday), to });
  await db.begin(async (tx) => {
    for (const s of materialized) {
      await tx`
        INSERT INTO sessions (id, academy_id, template_id, offering_id, location_id, court_id, coach_id, starts_at, ends_at, capacity, source, cancelled)
        VALUES (${s.id}, ${academyId}, ${s.templateId}, ${s.offeringId}, ${s.locationId}, ${s.courtId}, ${s.coachStaffId}, ${s.startsAt}, ${s.endsAt}, ${s.capacity}, ${s.source}, false)
        ON CONFLICT (id) DO NOTHING
      `;
    }
  });
}

export async function weekSessions(db: Db, academyId: string, monday: Date): Promise<SessionView[]> {
  const from = mondayOf(monday);
  const to = addDays(from, 7);
  const rows = await db.unsafe(
    `${SESSION_SELECT} WHERE s.academy_id = $1 AND s.starts_at >= $2 AND s.starts_at < $3 ORDER BY s.starts_at, l.name, c.number`,
    [academyId, from, to],
  );
  return rows.map((row) => sessionFrom(row as Record<string, unknown>));
}

function occupies(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function occupyingOf(sessions: SessionView[]): SessionView[] {
  return sessions.filter((s) => s.cancelled === 0);
}

export async function weekGrid(db: Db, academyId: string, monday: Date): Promise<SessionView[]> {
  const from = mondayOf(monday);
  const locked = occupyingOf(await weekSessions(db, academyId, monday));
  const [blocks, courts, coaches, locations] = await Promise.all([
    db`SELECT coach_id, location_id, weekday, start_time, end_time FROM coach_availability WHERE academy_id = ${academyId}`,
    db`SELECT id, location_id FROM courts WHERE academy_id = ${academyId}`,
    db`SELECT id, name FROM coaches WHERE academy_id = ${academyId}`,
    db`SELECT id, name FROM locations WHERE academy_id = ${academyId}`,
  ]);
  const coachName = new Map((coaches as { id: string; name: string }[]).map((c) => [c.id, c.name]));
  const locName = new Map((locations as { id: string; name: string }[]).map((l) => [l.id, l.name]));
  const courtsAt = (locationId: string) => (courts as { id: string; location_id: string }[]).filter((c) => c.location_id === locationId);
  const out: SessionView[] = [];
  const seen = new Set<string>();

  for (let d = 0; d < 7; d++) {
    const day = addDays(from, d);
    const weekday = DAY_FROM_JS[day.getUTCDay()];
    for (const b of blocks as { coach_id: string; location_id: string; weekday: string; start_time: string; end_time: string }[]) {
      if (b.weekday !== weekday) continue;
      for (const hour of hoursInRange(b.start_time, b.end_time)) {
        const starts = slotStarts(day, hour);
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
        const freeCourt = courtsAt(b.location_id).some(
          (c) => !locked.some((s) => s.court_id === c.id && occupies(starts, ends, new Date(s.starts_at), new Date(s.ends_at))),
        );
        if (!freeCourt) continue;
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
          capacity: 4,
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

async function firstFreeCourt(db: Db, academyId: string, locationId: string, startsAt: Date, endsAt: Date): Promise<string> {
  const monday = mondayOf(startsAt);
  const locked = occupyingOf(await weekSessions(db, academyId, monday));
  const courts = await db`SELECT id FROM courts WHERE academy_id = ${academyId} AND location_id = ${locationId} ORDER BY number`;
  for (const c of courts as { id: string }[]) {
    const busy = locked.some((s) => s.court_id === c.id && occupies(startsAt, endsAt, new Date(s.starts_at), new Date(s.ends_at)));
    if (!busy) return c.id;
  }
  throw new Error("No hay pista libre en esa sede");
}

export async function getSession(db: Db, academyId: string, id: string): Promise<SessionView | null> {
  const open = parseOpenSlotId(id);
  if (open) {
    const [existing] = await db.unsafe(
      `${SESSION_SELECT} WHERE s.academy_id = $1 AND s.coach_id = $2 AND s.location_id = $3 AND s.starts_at = $4 AND s.cancelled = false`,
      [academyId, open.coachId, open.locationId, open.startsAt],
    );
    if (existing) return sessionFrom(existing as Record<string, unknown>);
    const [coach] = await db`SELECT name FROM coaches WHERE id = ${open.coachId} AND academy_id = ${academyId}`;
    const [loc] = await db`SELECT name FROM locations WHERE id = ${open.locationId} AND academy_id = ${academyId}`;
    if (!coach || !loc) return null;
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
      capacity: 4,
      source: "availability",
      cancelled: 0,
      booked: 0,
      pending: 0,
      confirmed: 0,
    };
  }
  const rows = await db.unsafe(`${SESSION_SELECT} WHERE s.academy_id = $1 AND s.id = $2`, [academyId, id]);
  const row = rows[0];
  return row ? sessionFrom(row as Record<string, unknown>) : null;
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
    dayWindow: { from: Date; to: Date };
  },
): Promise<string> {
  const [offering] = await db`SELECT * FROM offerings WHERE id = ${input.offeringId} AND academy_id = ${academyId}`;
  const [court] = await db`SELECT * FROM courts WHERE id = ${input.courtId} AND academy_id = ${academyId}`;
  if (!offering || !court) throw new Error("Offering o pista inexistente");
  const off = offering as Offering;
  const ct = court as Court;
  const endsAt = new Date(input.startsAt.getTime() + off.duration_minutes * 60_000);
  const existing = await db`
    SELECT id, court_id, coach_id, starts_at, ends_at, cancelled
    FROM sessions
    WHERE academy_id = ${academyId} AND starts_at >= ${input.dayWindow.from} AND starts_at < ${input.dayWindow.to}
  `;
  const id = crypto.randomUUID();
  assertNoOverlap(
    {
      id,
      courtId: ct.id,
      coachStaffId: input.coachId,
      startsAt: input.startsAt,
      endsAt,
    },
    (existing as Parameters<typeof toInterval>[0][]).map(toInterval),
  );
  await db`
    INSERT INTO sessions (id, academy_id, template_id, offering_id, location_id, court_id, coach_id, starts_at, ends_at, capacity, source, cancelled)
    VALUES (${id}, ${academyId}, null, ${off.id}, ${ct.location_id}, ${ct.id}, ${input.coachId}, ${input.startsAt}, ${endsAt}, ${off.capacity}, 'one_off', false)
  `;
  return id;
}

export async function cancelSession(db: Db, academyId: string, id: string): Promise<void> {
  await db`UPDATE sessions SET cancelled = true, source = 'exception' WHERE id = ${id} AND academy_id = ${academyId}`;
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
    const row = studentFrom(existing as Parameters<typeof studentFrom>[0]);
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
  const student: Student = {
    id: crypto.randomUUID(),
    academy_id: academyId,
    name: trimmedName,
    phone: trimmedPhone,
    clerk_user_id: extra?.clerkUserId ?? null,
    category: extra?.category ?? "beginner",
    side: extra?.side ?? null,
  };
  await db`
    INSERT INTO students (id, academy_id, name, phone, clerk_user_id, category, side)
    VALUES (${student.id}, ${student.academy_id}, ${student.name}, ${student.phone}, ${student.clerk_user_id}, ${student.category}, ${student.side})
  `;
  return student;
}

export async function updateStudent(
  db: Db,
  academyId: string,
  id: string,
  patch: { name?: string; category?: StudentCategory; side?: PlayingSide | null },
): Promise<void> {
  const [row] = await db`SELECT * FROM students WHERE id = ${id} AND academy_id = ${academyId}`;
  if (!row) throw new Error("Alumno inexistente");
  const current = studentFrom(row as Parameters<typeof studentFrom>[0]);
  const name = patch.name?.trim() || current.name;
  const category = patch.category ?? current.category;
  const side = patch.side === undefined ? current.side : patch.side;
  await db`UPDATE students SET name = ${name}, category = ${category}, side = ${side} WHERE id = ${id}`;
}
export async function identifyPlayer(
  db: Db,
  academyId: string,
  input: { clerkUserId?: string | null; cookieStudentId?: string | null; claimCookie?: boolean },
): Promise<Student | null> {
  if (input.clerkUserId) {
    const linked = await studentByClerk(db, academyId, input.clerkUserId);
    if (linked) return linked;
    if (input.claimCookie && input.cookieStudentId) {
      const cookie = await studentById(db, academyId, input.cookieStudentId);
      if (cookie && !cookie.clerk_user_id) {
        await db`UPDATE students SET clerk_user_id = ${input.clerkUserId}
          WHERE id = ${cookie.id} AND academy_id = ${academyId} AND clerk_user_id IS NULL`;
        return { ...cookie, clerk_user_id: input.clerkUserId };
      }
    }
    return null;
  }
  if (!input.cookieStudentId) return null;
  const cookie = await studentById(db, academyId, input.cookieStudentId);
  if (!cookie || cookie.clerk_user_id) return null;
  return cookie;
}
export async function studentByClerk(
  db: Db,
  academyId: string,
  clerkUserId: string,
): Promise<Student | null> {
  const [row] = await db`SELECT * FROM students WHERE academy_id = ${academyId} AND clerk_user_id = ${clerkUserId}`;
  return row ? studentFrom(row as Parameters<typeof studentFrom>[0]) : null;
}

export async function studentById(db: Db, academyId: string, id: string): Promise<Student | null> {
  const [row] = await db`SELECT * FROM students WHERE id = ${id} AND academy_id = ${academyId}`;
  return row ? studentFrom(row as Parameters<typeof studentFrom>[0]) : null;
}

export async function bookStudent(
  db: Db,
  academyId: string,
  sessionId: string,
  studentId: string,
  channel: "admin" | "web" = "admin",
): Promise<BookingStatus> {
  const [session] = await db`SELECT id, capacity, cancelled FROM sessions WHERE id = ${sessionId} AND academy_id = ${academyId}`;
  if (!session || flag(session.cancelled)) throw new Error("Sesión inexistente o cancelada");
  const [student] = await db`SELECT id FROM students WHERE id = ${studentId} AND academy_id = ${academyId}`;
  if (!student) throw new Error("Alumno inexistente");
  const existing = await db`SELECT status FROM bookings WHERE session_id = ${sessionId}`;
  const [already] = await db`SELECT id FROM bookings WHERE session_id = ${sessionId} AND student_id = ${studentId}`;
  if (already) throw new Error("Ese alumno ya está en la clase");
  const status = nextBookingStatus(num(session.capacity), existing as { status: BookingStatus }[]);
  if (channel === "web" && status === "waitlisted") {
    throw new Error("Clase completa");
  }
  await db`
    INSERT INTO bookings (id, session_id, student_id, status, channel)
    VALUES (${crypto.randomUUID()}, ${sessionId}, ${studentId}, ${status}, ${channel})
  `;
  return status;
}

async function resolveBookerStudent(
  db: Db,
  academyId: string,
  name: string,
  phone: string,
  extra?: { category?: StudentCategory; side?: PlayingSide | null; clerkUserId?: string | null; cookieStudentId?: string | null },
): Promise<Student> {
  if (extra?.clerkUserId) {
    const linked = await studentByClerk(db, academyId, extra.clerkUserId);
    if (linked) return linked;
    return findOrCreateStudent(db, academyId, name, phone, extra);
  }
  if (extra?.cookieStudentId) {
    const cookie = await studentById(db, academyId, extra.cookieStudentId);
    if (cookie) {
      if (cookie.clerk_user_id) throw new ClaimedFichaError();
      return cookie;
    }
  }
  const trimmedPhone = phone.trim();
  if (trimmedPhone) {
    const [existing] = await db`SELECT * FROM students WHERE academy_id = ${academyId} AND phone = ${trimmedPhone}`;
    if (existing) {
      const row = studentFrom(existing as Parameters<typeof studentFrom>[0]);
      if (row.clerk_user_id) throw new ClaimedFichaError();
    }
  }
  return findOrCreateStudent(db, academyId, name, phone, extra);
}

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
    cookieStudentId?: string | null;
    offeringId?: string | null;
  },
): Promise<{ status: BookingStatus; student: Student; sessionId: string }> {
  const open = parseOpenSlotId(sessionId);
  let realId = sessionId;
  if (open) {
    const weekday = DAY_FROM_JS[open.startsAt.getUTCDay()];
    const hour = open.startsAt.toISOString().slice(11, 16);
    const covered = (await db`
      SELECT start_time, end_time FROM coach_availability
      WHERE academy_id = ${academyId} AND coach_id = ${open.coachId} AND location_id = ${open.locationId} AND weekday = ${weekday}
    `) as { start_time: string; end_time: string }[];
    if (!covered.some((b) => hoursInRange(b.start_time, b.end_time).includes(hour))) {
      throw new Error("Ese horario no está en la planilla madre");
    }
    const existing = await getSession(db, academyId, sessionId);
    if (existing && existing.source !== "availability") {
      if (extra?.offeringId && extra.offeringId !== existing.offering_id) {
        throw new Error(existing.offering_name === "Individual" ? "Esa hora ya es individual" : "Esa hora ya es grupal");
      }
      realId = existing.id;
    } else {
      const offeringId = extra?.offeringId ?? "";
      const [off] = await db`SELECT id, capacity FROM offerings WHERE id = ${offeringId} AND academy_id = ${academyId}`;
      if (!off || (num(off.capacity) !== 1 && num(off.capacity) !== 4)) {
        throw new Error("Elegí individual o grupal");
      }
      const ends = slotEnds(open.startsAt);
      const courtId = await firstFreeCourt(db, academyId, open.locationId, open.startsAt, ends);
      realId = await createSession(db, academyId, {
        offeringId,
        courtId,
        coachId: open.coachId,
        startsAt: open.startsAt,
        dayWindow: { from: mondayOf(open.startsAt), to: addDays(mondayOf(open.startsAt), 7) },
      });
    }
  }
  const [session] = await db`SELECT starts_at, cancelled FROM sessions WHERE id = ${realId} AND academy_id = ${academyId}`;
  if (!session || flag(session.cancelled)) throw new Error("Sesión inexistente o cancelada");
  const startsAt = new Date(iso(session.starts_at));
  if (startsAt < new Date()) throw new Error("Ese horario ya pasó");
  const ac = await academyById(db, academyId);
  if (!selfServeOpen(startsAt, ac.cutoff_hours)) throw new Error(cutoffMessage(ac.cutoff_hours));
  const student = await resolveBookerStudent(db, academyId, name, phone, extra);
  const status = await bookStudent(db, academyId, realId, student.id, "web");
  return { status, student, sessionId: realId };
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
  return row ? packFromRow(row as Parameters<typeof packFromRow>[0]) : null;
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
  const [booking] = await db`
    SELECT b.id, b.session_id, b.student_id, b.status, b.pack_id
    FROM bookings b
    JOIN sessions s ON s.id = b.session_id
    WHERE b.id = ${bookingId} AND s.academy_id = ${academyId}
  `;
  if (!booking) throw new Error("Reserva inexistente");
  if (status === "cancelled") {
    await applyCancel(db, academyId, booking, false);
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

export async function selfServeCancel(db: Db, academyId: string, bookingId: string, studentId: string): Promise<void> {
  const [booking] = await db`
    SELECT b.id, b.session_id, b.student_id, b.status, b.pack_id
    FROM bookings b
    JOIN sessions s ON s.id = b.session_id
    WHERE b.id = ${bookingId} AND s.academy_id = ${academyId} AND b.student_id = ${studentId}
  `;
  if (!booking) throw new Error("Reserva inexistente");
  await applyCancel(db, academyId, booking, true);
}

async function applyCancel(
  db: Db,
  academyId: string,
  booking: { id: unknown; session_id: unknown; student_id: unknown; status: unknown; pack_id: unknown },
  selfServe: boolean,
): Promise<void> {
  if (booking.status === "cancelled") return;
  const [session] = await db`SELECT starts_at FROM sessions WHERE id = ${booking.session_id as string} AND academy_id = ${academyId}`;
  if (!session) throw new Error("Sesión inexistente");
  const ac = await academyById(db, academyId);
  const open = selfServeOpen(new Date(iso(session.starts_at)), ac.cutoff_hours);
  if (selfServe && !open) throw new Error(cutoffMessage(ac.cutoff_hours));
  const occupying = OCCUPYING_BOOKING_STATUSES.has(booking.status as BookingStatus);
  const packId = booking.pack_id as string | null;
  if (occupying && packId && open) {
    const [row] = await db`SELECT * FROM packs WHERE id = ${packId}`;
    if (row) {
      const next = restoreOnCancel(packFromRow(row as Parameters<typeof packFromRow>[0]));
      await db`UPDATE packs SET remaining = ${next.remaining} WHERE id = ${next.id}`;
    }
  }
  await db`UPDATE bookings SET status = ${"cancelled"} WHERE id = ${booking.id as string}`;
}

export async function studentHistory(db: Db, academyId: string, studentId: string): Promise<PlayerBooking[]> {
  const rows = await db`
    SELECT b.id, b.session_id, b.status, s.starts_at, s.ends_at,
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
  return rows.map((row) => ({
    id: String(row.id),
    session_id: String(row.session_id),
    status: row.status as BookingStatus,
    starts_at: iso(row.starts_at),
    ends_at: iso(row.ends_at),
    offering_name: String(row.offering_name),
    coach_name: String(row.coach_name),
    location_name: String(row.location_name),
    court_name: String(row.court_name),
  }));
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
    timezone: "America/Asuncion",
    cutoff_hours: DEFAULT_CUTOFF_HOURS,
    clerk_org_id: input.orgId,
  };
  await db`
    INSERT INTO academy (id, slug, name, locale, currency, timezone, cutoff_hours, clerk_org_id)
    VALUES (${academy.id}, ${academy.slug}, ${academy.name}, ${academy.locale}, ${academy.currency}, ${academy.timezone}, ${academy.cutoff_hours}, ${academy.clerk_org_id})
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
  const [h, m] = input.startTime.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) throw new Error("Hora inválida");
  const end = new Date(Date.UTC(2000, 0, 1, h, m + Number(off.duration_minutes), 0));
  const endTime = `${String(end.getUTCHours()).padStart(2, "0")}:${String(end.getUTCMinutes()).padStart(2, "0")}`;
  const id = `tpl-${crypto.randomUUID().slice(0, 8)}`;
  await db`
    INSERT INTO templates (id, academy_id, offering_id, location_id, court_id, coach_id, weekday, start_time, end_time)
    VALUES (${id}, ${academyId}, ${input.offeringId}, ${input.locationId}, ${input.courtId}, ${input.coachId}, ${input.weekday}, ${input.startTime}, ${endTime})
  `;
  return id;
}

export async function deleteTemplate(db: Db, academyId: string, id: string): Promise<void> {
  await db`DELETE FROM templates WHERE id = ${id} AND academy_id = ${academyId}`;
}
