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
    await db`DROP VIEW IF EXISTS slot_hours`;
    await db`
      CREATE VIEW slot_hours AS
      SELECT
        a.academy_id,
        a.coach_id,
        a.location_id,
        a.weekday,
        (a.start_time::time + (g * INTERVAL '1 hour'))::time AS hour
      FROM coach_availability a
      CROSS JOIN LATERAL generate_series(
        0,
        GREATEST((EXTRACT(EPOCH FROM (a.end_time::time - a.start_time::time)) / 3600)::int - 1, -1)
      ) AS g
    `;
  });
  await apply(db, "007_metabase_disponibilidad", async () => {
    await db`DROP VIEW IF EXISTS metabase_disponibilidad_calendario`;
    await db`DROP VIEW IF EXISTS metabase_disponibilidad_profe`;
    await db`
      CREATE VIEW metabase_disponibilidad_profe AS
      SELECT
        ac.slug AS academia,
        ch.name AS profe,
        l.name AS sede,
        CASE sh.weekday
          WHEN 'monday' THEN 'Lunes'
          WHEN 'tuesday' THEN 'Martes'
          WHEN 'wednesday' THEN 'Miércoles'
          WHEN 'thursday' THEN 'Jueves'
          WHEN 'friday' THEN 'Viernes'
          WHEN 'saturday' THEN 'Sábado'
          ELSE 'Domingo'
        END AS dia,
        CASE sh.weekday
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
          ELSE 7
        END AS dia_n,
        sh.hour AS hora,
        to_char(sh.hour, 'HH24:MI') AS hora_txt
      FROM slot_hours sh
      JOIN academy ac ON ac.id = sh.academy_id
      JOIN coaches ch ON ch.id = sh.coach_id
      JOIN locations l ON l.id = sh.location_id
    `;
    await db`
      CREATE VIEW metabase_disponibilidad_calendario AS
      SELECT
        ac.slug AS academia,
        ch.name AS profe,
        l.name AS sede,
        d.fecha,
        CASE EXTRACT(ISODOW FROM d.fecha)::int
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
          ELSE 'Domingo'
        END AS dia,
        sh.hour AS hora,
        to_char(sh.hour, 'HH24:MI') AS hora_txt,
        ((d.fecha::timestamp + sh.hour) AT TIME ZONE 'UTC') AS empieza,
        ((d.fecha::timestamp + sh.hour + INTERVAL '1 hour') AT TIME ZONE 'UTC') AS termina,
        EXISTS (
          SELECT 1 FROM sessions s
          WHERE s.coach_id = sh.coach_id
            AND s.cancelled = false
            AND s.starts_at = ((d.fecha::timestamp + sh.hour) AT TIME ZONE 'UTC')
        ) AS ocupado
      FROM slot_hours sh
      JOIN academy ac ON ac.id = sh.academy_id
      JOIN coaches ch ON ch.id = sh.coach_id
      JOIN locations l ON l.id = sh.location_id
      CROSS JOIN LATERAL generate_series(
        date_trunc('week', timezone(ac.timezone, now()))::date,
        date_trunc('week', timezone(ac.timezone, now()))::date + 27,
        INTERVAL '1 day'
      ) AS d(fecha)
      WHERE EXTRACT(ISODOW FROM d.fecha)::int =
        CASE sh.weekday
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
          ELSE 7
        END
    `;
  });
  await apply(db, "008_metabase_fecha_date", async () => {
    await db`DROP VIEW IF EXISTS metabase_disponibilidad_calendario`;
    await db`
      CREATE VIEW metabase_disponibilidad_calendario AS
      SELECT
        ac.slug AS academia,
        ch.name AS profe,
        l.name AS sede,
        d.fecha::date AS fecha,
        CASE EXTRACT(ISODOW FROM d.fecha)::int
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
          ELSE 'Domingo'
        END AS dia,
        sh.hour AS hora,
        to_char(sh.hour, 'HH24:MI') AS hora_txt,
        ((d.fecha::timestamp + sh.hour) AT TIME ZONE 'UTC') AS empieza,
        ((d.fecha::timestamp + sh.hour + INTERVAL '1 hour') AT TIME ZONE 'UTC') AS termina,
        EXISTS (
          SELECT 1 FROM sessions s
          WHERE s.coach_id = sh.coach_id
            AND s.cancelled = false
            AND s.starts_at = ((d.fecha::timestamp + sh.hour) AT TIME ZONE 'UTC')
        ) AS ocupado
      FROM slot_hours sh
      JOIN academy ac ON ac.id = sh.academy_id
      JOIN coaches ch ON ch.id = sh.coach_id
      JOIN locations l ON l.id = sh.location_id
      CROSS JOIN LATERAL generate_series(
        date_trunc('week', timezone(ac.timezone, now()))::date,
        date_trunc('week', timezone(ac.timezone, now()))::date + 27,
        INTERVAL '1 day'
      ) AS d(fecha)
      WHERE EXTRACT(ISODOW FROM d.fecha)::int =
        CASE sh.weekday
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
          ELSE 7
        END
    `;
  });
}

async function apply(db: Db, id: string, run: () => Promise<void>): Promise<void> {
  const done = await db`SELECT id FROM schema_migrations WHERE id = ${id}`;
  if (done.length) return;
  await run();
  await db`INSERT INTO schema_migrations (id) VALUES (${id})`;
}
