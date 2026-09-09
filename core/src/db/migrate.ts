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
}

async function apply(db: Db, id: string, run: () => Promise<void>): Promise<void> {
  const done = await db`SELECT id FROM schema_migrations WHERE id = ${id}`;
  if (done.length) return;
  await run();
  await db`INSERT INTO schema_migrations (id) VALUES (${id})`;
}
