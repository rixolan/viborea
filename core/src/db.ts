import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { assertNoOverlap } from "./domain/overlap";
import { nextBookingStatus } from "./domain/capacity";
import { addDays, dateKey, materializeTemplate, mondayOf } from "./domain/template";
import type { BookingStatus, DayOfWeek, SessionInterval, WeeklyTemplateSlot } from "./domain/types";
import { OverlapError } from "./domain/types";

const SCHEMA = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS academy (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  locale TEXT NOT NULL,
  currency TEXT NOT NULL,
  timezone TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS courts (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL REFERENCES locations(id),
  name TEXT NOT NULL,
  number INTEGER
);
CREATE TABLE IF NOT EXISTS coaches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS offerings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  price INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  offering_id TEXT NOT NULL REFERENCES offerings(id),
  location_id TEXT NOT NULL REFERENCES locations(id),
  court_id TEXT NOT NULL REFERENCES courts(id),
  coach_id TEXT NOT NULL REFERENCES coaches(id),
  weekday TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES templates(id),
  offering_id TEXT NOT NULL REFERENCES offerings(id),
  location_id TEXT NOT NULL REFERENCES locations(id),
  court_id TEXT NOT NULL REFERENCES courts(id),
  coach_id TEXT NOT NULL REFERENCES coaches(id),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  source TEXT NOT NULL,
  cancelled INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  status TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'admin',
  UNIQUE(session_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_sessions_starts ON sessions(starts_at);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings(session_id);
`;

export type Academy = { id: string; name: string; locale: string; currency: string; timezone: string };
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
export type Student = { id: string; name: string; phone: string };

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
};

export function openDb(path = "data/bandeja.sqlite"): Database {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  const cols = db.query("PRAGMA table_info(students)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "phone")) {
    db.exec("ALTER TABLE students ADD COLUMN phone TEXT NOT NULL DEFAULT ''");
  }
  return db;
}

export function academy(db: Database): Academy {
  const row = db.query("SELECT * FROM academy LIMIT 1").get() as Academy | null;
  if (!row) throw new Error("Academy not seeded");
  return row;
}

export function catalogs(db: Database) {
  return {
    locations: db.query("SELECT * FROM locations ORDER BY name").all() as Location[],
    courts: db.query("SELECT * FROM courts ORDER BY location_id, number").all() as Court[],
    coaches: db.query("SELECT * FROM coaches ORDER BY name").all() as Coach[],
    offerings: db.query("SELECT * FROM offerings ORDER BY capacity").all() as Offering[],
    students: db.query("SELECT * FROM students ORDER BY name").all() as Student[],
  };
}

function toInterval(row: { id: string; court_id: string; coach_id: string; starts_at: string; ends_at: string; cancelled: number }): SessionInterval {
  return {
    id: row.id,
    courtId: row.court_id,
    coachStaffId: row.coach_id,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    cancelled: row.cancelled === 1,
  };
}

export function ensureWeek(db: Database, monday: Date): void {
  const templates = db.query("SELECT * FROM templates").all() as {
    id: string;
    offering_id: string;
    location_id: string;
    court_id: string;
    coach_id: string;
    weekday: DayOfWeek;
    start_time: string;
    end_time: string;
    capacity?: number;
  }[];
  const offerings = new Map(
    (db.query("SELECT id, capacity FROM offerings").all() as { id: string; capacity: number }[]).map(
      (o) => [o.id, o.capacity],
    ),
  );
  const slots: WeeklyTemplateSlot[] = templates.map((t) => ({
    id: t.id,
    offeringId: t.offering_id,
    locationId: t.location_id,
    courtId: t.court_id,
    coachStaffId: t.coach_id,
    dayOfWeek: t.weekday,
    startTime: t.start_time,
    endTime: t.end_time,
    capacity: offerings.get(t.offering_id) ?? 1,
  }));
  const to = addDays(mondayOf(monday), 7);
  const materialized = materializeTemplate(slots, { from: mondayOf(monday), to });
  const insert = db.prepare(`
    INSERT OR IGNORE INTO sessions
      (id, template_id, offering_id, location_id, court_id, coach_id, starts_at, ends_at, capacity, source, cancelled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `);
  const tx = db.transaction(() => {
    for (const s of materialized) {
      insert.run(
        s.id,
        s.templateId,
        s.offeringId,
        s.locationId,
        s.courtId,
        s.coachStaffId,
        s.startsAt.toISOString(),
        s.endsAt.toISOString(),
        s.capacity,
        s.source,
      );
    }
  });
  tx();
}

export function weekSessions(db: Database, monday: Date): SessionView[] {
  const from = mondayOf(monday).toISOString();
  const to = addDays(mondayOf(monday), 7).toISOString();
  return db
    .query(
      `
      SELECT s.*, o.name AS offering_name, l.name AS location_name, c.name AS court_name, ch.name AS coach_name,
        (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status IN ('pending_payment','confirmed','checked_in')) AS booked,
        (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'pending_payment') AS pending,
        (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'confirmed') AS confirmed
      FROM sessions s
      JOIN offerings o ON o.id = s.offering_id
      JOIN locations l ON l.id = s.location_id
      JOIN courts c ON c.id = s.court_id
      JOIN coaches ch ON ch.id = s.coach_id
      WHERE s.starts_at >= ? AND s.starts_at < ?
      ORDER BY s.starts_at, l.name, c.number
    `,
    )
    .all(from, to) as SessionView[];
}

export function getSession(db: Database, id: string): SessionView | null {
  return (
    (db
      .query(
        `
      SELECT s.*, o.name AS offering_name, l.name AS location_name, c.name AS court_name, ch.name AS coach_name,
        (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status IN ('pending_payment','confirmed','checked_in')) AS booked,
        (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'pending_payment') AS pending,
        (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'confirmed') AS confirmed
      FROM sessions s
      JOIN offerings o ON o.id = s.offering_id
      JOIN locations l ON l.id = s.location_id
      JOIN courts c ON c.id = s.court_id
      JOIN coaches ch ON ch.id = s.coach_id
      WHERE s.id = ?
    `,
      )
      .get(id) as SessionView | null) ?? null
  );
}

export function sessionBookings(db: Database, sessionId: string): BookingView[] {
  return db
    .query(
      `
      SELECT b.id, b.session_id, b.student_id, st.name AS student_name, b.status
      FROM bookings b
      JOIN students st ON st.id = b.student_id
      WHERE b.session_id = ?
      ORDER BY st.name
    `,
    )
    .all(sessionId) as BookingView[];
}

export function createSession(
  db: Database,
  input: {
    offeringId: string;
    courtId: string;
    coachId: string;
    startsAt: Date;
    dayWindow: { from: Date; to: Date };
  },
): string {
  const offering = db.query("SELECT * FROM offerings WHERE id = ?").get(input.offeringId) as Offering | null;
  const court = db.query("SELECT * FROM courts WHERE id = ?").get(input.courtId) as Court | null;
  if (!offering || !court) throw new Error("Offering o pista inexistente");
  const endsAt = new Date(input.startsAt.getTime() + offering.duration_minutes * 60_000);
  const existing = db
    .query("SELECT id, court_id, coach_id, starts_at, ends_at, cancelled FROM sessions WHERE starts_at >= ? AND starts_at < ?")
    .all(input.dayWindow.from.toISOString(), input.dayWindow.to.toISOString()) as {
    id: string;
    court_id: string;
    coach_id: string;
    starts_at: string;
    ends_at: string;
    cancelled: number;
  }[];
  const id = crypto.randomUUID();
  assertNoOverlap(
    {
      id,
      courtId: court.id,
      coachStaffId: input.coachId,
      startsAt: input.startsAt,
      endsAt,
    },
    existing.map(toInterval),
  );
  db.query(
    `
    INSERT INTO sessions (id, template_id, offering_id, location_id, court_id, coach_id, starts_at, ends_at, capacity, source, cancelled)
    VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 'one_off', 0)
  `,
  ).run(
    id,
    offering.id,
    court.location_id,
    court.id,
    input.coachId,
    input.startsAt.toISOString(),
    endsAt.toISOString(),
    offering.capacity,
  );
  return id;
}

export function cancelSession(db: Database, id: string): void {
  db.query("UPDATE sessions SET cancelled = 1, source = 'exception' WHERE id = ?").run(id);
}

export function findOrCreateStudent(db: Database, name: string, phone: string): Student {
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  if (!trimmedName || !trimmedPhone) throw new Error("Nombre y teléfono son obligatorios");
  const existing = db.query("SELECT * FROM students WHERE phone = ?").get(trimmedPhone) as Student | null;
  if (existing) {
    if (existing.name !== trimmedName) {
      db.query("UPDATE students SET name = ? WHERE id = ?").run(trimmedName, existing.id);
      return { ...existing, name: trimmedName };
    }
    return existing;
  }
  const student: Student = { id: crypto.randomUUID(), name: trimmedName, phone: trimmedPhone };
  db.query("INSERT INTO students (id, name, phone) VALUES (?, ?, ?)").run(student.id, student.name, student.phone);
  return student;
}

export function bookStudent(
  db: Database,
  sessionId: string,
  studentId: string,
  channel: "admin" | "web" = "admin",
): BookingStatus {
  const session = db.query("SELECT * FROM sessions WHERE id = ?").get(sessionId) as {
    id: string;
    capacity: number;
    cancelled: number;
  } | null;
  if (!session || session.cancelled) throw new Error("Sesión inexistente o cancelada");
  const existing = db
    .query("SELECT status FROM bookings WHERE session_id = ?")
    .all(sessionId) as { status: BookingStatus }[];
  const already = db
    .query("SELECT id FROM bookings WHERE session_id = ? AND student_id = ?")
    .get(sessionId, studentId);
  if (already) throw new Error("Ese alumno ya está en la clase");
  const status = nextBookingStatus(session.capacity, existing);
  if (channel === "web" && status === "waitlisted") {
    throw new Error("Clase completa");
  }
  db.query("INSERT INTO bookings (id, session_id, student_id, status, channel) VALUES (?, ?, ?, ?, ?)").run(
    crypto.randomUUID(),
    sessionId,
    studentId,
    status,
    channel,
  );
  return status;
}

export function publicBook(db: Database, sessionId: string, name: string, phone: string): BookingStatus {
  const session = db.query("SELECT starts_at, cancelled FROM sessions WHERE id = ?").get(sessionId) as
    | { starts_at: string; cancelled: number }
    | null;
  if (!session || session.cancelled) throw new Error("Sesión inexistente o cancelada");
  if (new Date(session.starts_at) < new Date()) throw new Error("Ese horario ya pasó");
  const student = findOrCreateStudent(db, name, phone);
  return bookStudent(db, sessionId, student.id, "web");
}

export function setBookingStatus(db: Database, bookingId: string, status: BookingStatus): void {
  db.query("UPDATE bookings SET status = ? WHERE id = ?").run(status, bookingId);
}

export { OverlapError, mondayOf, dateKey, addDays };
