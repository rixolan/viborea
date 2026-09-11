import { join } from "node:path";
import type { Db } from "./pg";

export async function migrate(db: Db): Promise<void> {
  await db`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await apply(db, "001_init", async () => {
    await db.file(join(import.meta.dir, "schema.sql"));
  });
  await apply(db, "002_cutoff_hours", async () => {
    await db`ALTER TABLE academy ADD COLUMN IF NOT EXISTS cutoff_hours INTEGER NOT NULL DEFAULT 12`;
  });
  await apply(db, "003_location_address", async () => {
    await db`ALTER TABLE locations ADD COLUMN IF NOT EXISTS address TEXT`;
    await db`ALTER TABLE locations ADD COLUMN IF NOT EXISTS maps_url TEXT`;
  });
  await apply(db, "004_location_image", async () => {
    await db`ALTER TABLE locations ADD COLUMN IF NOT EXISTS image_url TEXT`;
  });
  await apply(db, "005_multi_academy", async () => {
    await db`ALTER TABLE academy ADD COLUMN IF NOT EXISTS slug TEXT`;
    await db`ALTER TABLE academy ADD COLUMN IF NOT EXISTS clerk_org_id TEXT`;
    await db`UPDATE academy SET slug = 'academiadg' WHERE slug IS NULL`;
    await db`ALTER TABLE academy ALTER COLUMN slug SET NOT NULL`;
    await db`CREATE UNIQUE INDEX IF NOT EXISTS academy_slug_key ON academy (slug)`;
    await db`CREATE UNIQUE INDEX IF NOT EXISTS academy_clerk_org_id_key ON academy (clerk_org_id) WHERE clerk_org_id IS NOT NULL`;

    for (const table of ["locations", "courts", "coaches", "offerings", "templates", "sessions", "students"] as const) {
      await db.unsafe(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS academy_id TEXT REFERENCES academy(id)`);
      await db.unsafe(
        `UPDATE ${table} SET academy_id = (SELECT id FROM academy ORDER BY id LIMIT 1) WHERE academy_id IS NULL`,
      );
      await db.unsafe(`ALTER TABLE ${table} ALTER COLUMN academy_id SET NOT NULL`);
    }

    await db`ALTER TABLE students ADD COLUMN IF NOT EXISTS clerk_user_id TEXT`;
    await db`ALTER TABLE students DROP CONSTRAINT IF EXISTS students_phone_key`;
    await db`CREATE UNIQUE INDEX IF NOT EXISTS students_academy_phone ON students (academy_id, phone)`;
    await db`CREATE UNIQUE INDEX IF NOT EXISTS students_academy_clerk ON students (academy_id, clerk_user_id) WHERE clerk_user_id IS NOT NULL`;
    await db`CREATE INDEX IF NOT EXISTS idx_sessions_academy_starts ON sessions (academy_id, starts_at)`;
    await db`CREATE INDEX IF NOT EXISTS idx_locations_academy ON locations (academy_id)`;
    await db`CREATE INDEX IF NOT EXISTS idx_students_academy ON students (academy_id)`;
  });
  await apply(db, "006_coach_availability", async () => {
    await db`
      CREATE TABLE IF NOT EXISTS coach_availability (
        id TEXT PRIMARY KEY,
        academy_id TEXT NOT NULL REFERENCES academy(id),
        coach_id TEXT NOT NULL REFERENCES coaches(id),
        location_id TEXT NOT NULL REFERENCES locations(id),
        weekday TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL
      )
    `;
    await db`CREATE INDEX IF NOT EXISTS idx_availability_academy ON coach_availability (academy_id, weekday)`;
  });
  await apply(db, "009_drop_metabase_views", async () => {
    await db`DROP VIEW IF EXISTS metabase_disponibilidad_calendario`;
    await db`DROP VIEW IF EXISTS metabase_disponibilidad_profe`;
    await db`DROP VIEW IF EXISTS slot_hours`;
  });
  await apply(db, "010_booking_reminded", async () => {
    await db`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ`;
  });
  await apply(db, "011_coach_profile", async () => {
    await db`ALTER TABLE coaches ADD COLUMN IF NOT EXISTS bio TEXT`;
    await db`ALTER TABLE coaches ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{}'`;
  });

  await apply(db, "012_session_local_time", async () => {
    // Times were written as naive UTC but meant the sede's wall clock: a 06:00
    // Asunción class sat at 06:00Z instead of 09:00Z, so every cutoff and
    // reminder comparison ran three hours early. Reinterpret in place.
    await db`
      UPDATE sessions s SET
        starts_at = (s.starts_at AT TIME ZONE 'UTC') AT TIME ZONE a.timezone,
        ends_at = (s.ends_at AT TIME ZONE 'UTC') AT TIME ZONE a.timezone
      FROM academy a
      WHERE a.id = s.academy_id AND a.timezone <> 'UTC'
    `;
  });
  await apply(db, "013_session_overlap_exclusion", async () => {
    // The overlap rule was only enforced in TypeScript, so two players booking
    // the same hole at the same moment both passed the check and both wrote.
    await db`CREATE EXTENSION IF NOT EXISTS btree_gist`;
    for (let pass = 0; pass < 8; pass++) {
      const cleaned = await db`
        UPDATE sessions SET cancelled = true, source = 'exception'
        WHERE id IN (
          SELECT b.id
          FROM sessions a
          JOIN sessions b ON a.academy_id = b.academy_id AND a.id < b.id
          WHERE NOT a.cancelled AND NOT b.cancelled
            AND tstzrange(a.starts_at, a.ends_at) && tstzrange(b.starts_at, b.ends_at)
            AND (a.court_id = b.court_id OR a.coach_id = b.coach_id)
            AND NOT EXISTS (
              SELECT 1 FROM bookings bk
              WHERE bk.session_id = b.id
                AND bk.status IN ('pending_payment', 'confirmed', 'checked_in')
            )
        )
        RETURNING id
      `;
      if (!cleaned.length) break;
    }
    const stuck = await db`
      SELECT a.id AS keep, b.id AS clash, a.starts_at
      FROM sessions a
      JOIN sessions b ON a.academy_id = b.academy_id AND a.id < b.id
      WHERE NOT a.cancelled AND NOT b.cancelled
        AND tstzrange(a.starts_at, a.ends_at) && tstzrange(b.starts_at, b.ends_at)
        AND (a.court_id = b.court_id OR a.coach_id = b.coach_id)
      LIMIT 5
    `;
    if (stuck.length) {
      const pairs = stuck.map((r) => `${r.keep} <> ${r.clash}`).join("; ");
      throw new Error(
        `No se puede activar la restricción de solape: hay clases superpuestas con reservas. Cancelá una de cada par y volvé a desplegar. ${pairs}`,
      );
    }
    await addExclusion(db, "sessions_court_no_overlap", "court_id");
    await addExclusion(db, "sessions_coach_no_overlap", "coach_id");
  });
  await apply(db, "014_booking_audit", async () => {
    await db`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()`;
    await db`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_attempts INTEGER NOT NULL DEFAULT 0`;
    await db`CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings (student_id)`;
    await db`CREATE INDEX IF NOT EXISTS idx_bookings_reminders ON bookings (status, reminded_at)`;
  });
  await apply(db, "015_academy_hold_minutes", async () => {
    await db`ALTER TABLE academy ADD COLUMN IF NOT EXISTS hold_minutes INTEGER NOT NULL DEFAULT 0`;
  });
  await apply(db, "016_availability_unique", async () => {
    await db`
      DELETE FROM coach_availability c
      WHERE EXISTS (
        SELECT 1 FROM coach_availability o
        WHERE o.academy_id = c.academy_id AND o.coach_id = c.coach_id
          AND o.weekday = c.weekday AND o.start_time = c.start_time AND o.id < c.id
      )
    `;
    await db`
      CREATE UNIQUE INDEX IF NOT EXISTS coach_availability_slot
      ON coach_availability (academy_id, coach_id, weekday, start_time)
    `;
    await db`CREATE INDEX IF NOT EXISTS idx_availability_coach ON coach_availability (coach_id, weekday)`;
  });
}

/** GiST exclusion on [starts_at, ends_at) per court / per coach, live rows only. */
async function addExclusion(db: Db, name: string, column: "court_id" | "coach_id"): Promise<void> {
  const [existing] = await db`SELECT conname FROM pg_constraint WHERE conname = ${name}`;
  if (existing) return;
  await db.unsafe(
    `ALTER TABLE sessions ADD CONSTRAINT ${name} EXCLUDE USING gist (
       ${column} WITH =, tstzrange(starts_at, ends_at) WITH &&
     ) WHERE (NOT cancelled)`,
  );
}

async function apply(db: Db, id: string, run: () => Promise<void>): Promise<void> {
  const done = await db`SELECT id FROM schema_migrations WHERE id = ${id}`;
  if (done.length) return;
  await run();
  await db`INSERT INTO schema_migrations (id) VALUES (${id})`;
}
