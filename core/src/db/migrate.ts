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
}

async function apply(db: Db, id: string, run: () => Promise<void>): Promise<void> {
  const done = await db`SELECT id FROM schema_migrations WHERE id = ${id}`;
  if (done.length) return;
  await run();
  await db`INSERT INTO schema_migrations (id) VALUES (${id})`;
}
