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
import { OCCUPYING_BOOKING_STATUSES, type BookingStatus } from "./domain/types";
import { OverlapError } from "./domain/types";
import { cutoffMessage, DEFAULT_CUTOFF_HOURS, parseCutoffHours, selfServeOpen } from "./domain/cutoff";
import { connect, type Db } from "./db/pg";
import { migrate } from "./db/migrate";

export type { Db };

export type Academy = {
  id: string;
  name: string;
  locale: string;
  currency: string;
  timezone: string;
  cutoff_hours: number;
};
export type Location = { id: string; name: string };
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
  name: string;
  phone: string;
  category: StudentCategory;
  side: PlayingSide | null;
};

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
  name: string;
  phone: string;
  category: string;
  side: string | null;
}): Student {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    category: parseCategory(row.category),
    side: parseSide(row.side),
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

export async function academy(db: Db): Promise<Academy> {
  const [row] = await db`SELECT * FROM academy LIMIT 1`;
  if (!row) throw new Error("Academy not seeded");
  const hours = num(row.cutoff_hours);
  return {
    id: String(row.id),
    name: String(row.name),
    locale: String(row.locale),
    currency: String(row.currency),
    timezone: String(row.timezone),
    cutoff_hours: hours > 0 ? hours : DEFAULT_CUTOFF_HOURS,
  };
}

export async function updateCutoffHours(db: Db, raw: string | number): Promise<number> {
  const hours = parseCutoffHours(raw);
  await db`UPDATE academy SET cutoff_hours = ${hours}`;
  return hours;
}

export async function catalogs(db: Db) {
  const [locations, courts, coaches, offerings, students] = await Promise.all([
    db`SELECT * FROM locations ORDER BY name`,
    db`SELECT * FROM courts ORDER BY location_id, number`,
    db`SELECT * FROM coaches ORDER BY name`,
    db`SELECT * FROM offerings ORDER BY capacity`,
    db`SELECT * FROM students ORDER BY name`,
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

export async function ensureWeek(db: Db, monday: Date): Promise<void> {
  const templates = await db`SELECT * FROM templates`;
  const offerings = await db`SELECT id, capacity FROM offerings`;
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
        INSERT INTO sessions (id, template_id, offering_id, location_id, court_id, coach_id, starts_at, ends_at, capacity, source, cancelled)
        VALUES (${s.id}, ${s.templateId}, ${s.offeringId}, ${s.locationId}, ${s.courtId}, ${s.coachStaffId}, ${s.startsAt}, ${s.endsAt}, ${s.capacity}, ${s.source}, false)
        ON CONFLICT (id) DO NOTHING
      `;
    }
  });
}

export async function weekSessions(db: Db, monday: Date): Promise<SessionView[]> {
  const from = mondayOf(monday);
  const to = addDays(from, 7);
  const rows = await db.unsafe(`${SESSION_SELECT} WHERE s.starts_at >= $1 AND s.starts_at < $2 ORDER BY s.starts_at, l.name, c.number`, [
    from,
    to,
  ]);
  return rows.map((row) => sessionFrom(row as Record<string, unknown>));
}

export async function getSession(db: Db, id: string): Promise<SessionView | null> {
  const rows = await db.unsafe(`${SESSION_SELECT} WHERE s.id = $1`, [id]);
  const row = rows[0];
  return row ? sessionFrom(row as Record<string, unknown>) : null;
}

export async function sessionBookings(db: Db, sessionId: string): Promise<BookingView[]> {
  const rows = await db`
    SELECT b.id, b.session_id, b.student_id, st.name AS student_name, b.status, st.category, st.side
    FROM bookings b
    JOIN students st ON st.id = b.student_id
    WHERE b.session_id = ${sessionId}
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
  input: {
    offeringId: string;
    courtId: string;
    coachId: string;
    startsAt: Date;
    dayWindow: { from: Date; to: Date };
  },
): Promise<string> {
  const [offering] = await db`SELECT * FROM offerings WHERE id = ${input.offeringId}`;
  const [court] = await db`SELECT * FROM courts WHERE id = ${input.courtId}`;
  if (!offering || !court) throw new Error("Offering o pista inexistente");
  const off = offering as Offering;
  const ct = court as Court;
  const endsAt = new Date(input.startsAt.getTime() + off.duration_minutes * 60_000);
  const existing = await db`
    SELECT id, court_id, coach_id, starts_at, ends_at, cancelled
    FROM sessions
    WHERE starts_at >= ${input.dayWindow.from} AND starts_at < ${input.dayWindow.to}
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
    INSERT INTO sessions (id, template_id, offering_id, location_id, court_id, coach_id, starts_at, ends_at, capacity, source, cancelled)
    VALUES (${id}, null, ${off.id}, ${ct.location_id}, ${ct.id}, ${input.coachId}, ${input.startsAt}, ${endsAt}, ${off.capacity}, 'one_off', false)
  `;
  return id;
}

export async function cancelSession(db: Db, id: string): Promise<void> {
  await db`UPDATE sessions SET cancelled = true, source = 'exception' WHERE id = ${id}`;
}

export async function findOrCreateStudent(
  db: Db,
  name: string,
  phone: string,
  extra?: { category?: StudentCategory; side?: PlayingSide | null },
): Promise<Student> {
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  if (!trimmedName || !trimmedPhone) throw new Error("Nombre y teléfono son obligatorios");
  const [existing] = await db`SELECT * FROM students WHERE phone = ${trimmedPhone}`;
  if (existing) {
    const row = studentFrom(existing as Parameters<typeof studentFrom>[0]);
    const category = extra?.category ?? row.category;
    const side = extra?.side === undefined ? row.side : extra.side;
    if (row.name !== trimmedName || category !== row.category || side !== row.side) {
      await db`UPDATE students SET name = ${trimmedName}, category = ${category}, side = ${side} WHERE id = ${row.id}`;
      return { ...row, name: trimmedName, category, side };
    }
    return row;
  }
  const student: Student = {
    id: crypto.randomUUID(),
    name: trimmedName,
    phone: trimmedPhone,
    category: extra?.category ?? "beginner",
    side: extra?.side ?? null,
  };
  await db`
    INSERT INTO students (id, name, phone, category, side)
    VALUES (${student.id}, ${student.name}, ${student.phone}, ${student.category}, ${student.side})
  `;
  return student;
}

export async function updateStudent(
  db: Db,
  id: string,
  patch: { name?: string; category?: StudentCategory; side?: PlayingSide | null },
): Promise<void> {
  const [row] = await db`SELECT * FROM students WHERE id = ${id}`;
  if (!row) throw new Error("Alumno inexistente");
  const current = studentFrom(row as Parameters<typeof studentFrom>[0]);
  const name = patch.name?.trim() || current.name;
  const category = patch.category ?? current.category;
  const side = patch.side === undefined ? current.side : patch.side;
  await db`UPDATE students SET name = ${name}, category = ${category}, side = ${side} WHERE id = ${id}`;
}

export async function bookStudent(
  db: Db,
  sessionId: string,
  studentId: string,
  channel: "admin" | "web" = "admin",
): Promise<BookingStatus> {
  const [session] = await db`SELECT id, capacity, cancelled FROM sessions WHERE id = ${sessionId}`;
  if (!session || flag(session.cancelled)) throw new Error("Sesión inexistente o cancelada");
  const existing = await db`SELECT status FROM bookings WHERE session_id = ${sessionId}`;
  const [already] = await db`SELECT id FROM bookings WHERE session_id = ${sessionId} AND student_id = ${studentId}`;
  if (already) throw new Error("Ese alumno ya está en la clase");
  const status = nextBookingStatus(
    num(session.capacity),
    existing as { status: BookingStatus }[],
  );
  if (channel === "web" && status === "waitlisted") {
    throw new Error("Clase completa");
  }
  await db`
    INSERT INTO bookings (id, session_id, student_id, status, channel)
    VALUES (${crypto.randomUUID()}, ${sessionId}, ${studentId}, ${status}, ${channel})
  `;
  return status;
}

export async function publicBook(
  db: Db,
  sessionId: string,
  name: string,
  phone: string,
  extra?: { category?: StudentCategory; side?: PlayingSide | null },
): Promise<BookingStatus> {
  const [session] = await db`SELECT starts_at, cancelled FROM sessions WHERE id = ${sessionId}`;
  if (!session || flag(session.cancelled)) throw new Error("Sesión inexistente o cancelada");
  const startsAt = new Date(iso(session.starts_at));
  if (startsAt < new Date()) throw new Error("Ese horario ya pasó");
  const ac = await academy(db);
  if (!selfServeOpen(startsAt, ac.cutoff_hours)) throw new Error(cutoffMessage(ac.cutoff_hours));
  const student = await findOrCreateStudent(db, name, phone, extra);
  return bookStudent(db, sessionId, student.id, "web");
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

export async function setBookingStatus(db: Db, bookingId: string, status: BookingStatus): Promise<PackAlert | null> {
  const [booking] = await db`SELECT id, session_id, student_id, status, pack_id FROM bookings WHERE id = ${bookingId}`;
  if (!booking) throw new Error("Reserva inexistente");
  if (status === "cancelled") {
    await applyCancel(db, booking, false);
    return null;
  }
  if (status !== "confirmed" || booking.status === "confirmed") {
    await db`UPDATE bookings SET status = ${status} WHERE id = ${bookingId}`;
    return null;
  }
  const [session] = await db`SELECT capacity FROM sessions WHERE id = ${booking.session_id as string}`;
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

export async function selfServeCancel(db: Db, bookingId: string): Promise<void> {
  const [booking] = await db`SELECT id, session_id, student_id, status, pack_id FROM bookings WHERE id = ${bookingId}`;
  if (!booking) throw new Error("Reserva inexistente");
  await applyCancel(db, booking, true);
}

async function applyCancel(
  db: Db,
  booking: { id: unknown; session_id: unknown; student_id: unknown; status: unknown; pack_id: unknown },
  selfServe: boolean,
): Promise<void> {
  if (booking.status === "cancelled") return;
  const [session] = await db`SELECT starts_at FROM sessions WHERE id = ${booking.session_id as string}`;
  if (!session) throw new Error("Sesión inexistente");
  const ac = await academy(db);
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

export async function listTemplates(db: Db): Promise<TemplateView[]> {
  const rows = await db`
    SELECT t.id, t.offering_id, o.name AS offering_name, t.location_id, l.name AS location_name,
      t.court_id, c.name AS court_name, t.coach_id, ch.name AS coach_name, t.weekday, t.start_time, t.end_time
    FROM templates t
    JOIN offerings o ON o.id = t.offering_id
    JOIN locations l ON l.id = t.location_id
    JOIN courts c ON c.id = t.court_id
    JOIN coaches ch ON ch.id = t.coach_id
    ORDER BY ch.name, t.weekday, t.start_time
  `;
  return rows as unknown as TemplateView[];
}

export async function createTemplate(
  db: Db,
  input: {
    offeringId: string;
    locationId: string;
    courtId: string;
    coachId: string;
    weekday: DayOfWeek;
    startTime: string;
  },
): Promise<string> {
  const [off] = await db`SELECT duration_minutes FROM offerings WHERE id = ${input.offeringId}`;
  if (!off) throw new Error("Offering inexistente");
  const [h, m] = input.startTime.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) throw new Error("Hora inválida");
  const end = new Date(Date.UTC(2000, 0, 1, h, m + Number(off.duration_minutes), 0));
  const endTime = `${String(end.getUTCHours()).padStart(2, "0")}:${String(end.getUTCMinutes()).padStart(2, "0")}`;
  const id = `tpl-${crypto.randomUUID().slice(0, 8)}`;
  await db`
    INSERT INTO templates (id, offering_id, location_id, court_id, coach_id, weekday, start_time, end_time)
    VALUES (${id}, ${input.offeringId}, ${input.locationId}, ${input.courtId}, ${input.coachId}, ${input.weekday}, ${input.startTime}, ${endTime})
  `;
  return id;
}

export async function deleteTemplate(db: Db, id: string): Promise<void> {
  await db`DELETE FROM templates WHERE id = ${id}`;
}
