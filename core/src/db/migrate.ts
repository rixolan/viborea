import { join } from "node:path";
import type { Db } from "./pg";

export async function migrate(db: Db): Promise<void> {
  await db`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  const id = "001_init";
  const done = await db`SELECT id FROM schema_migrations WHERE id = ${id}`;
  if (done.length) return;
  await db.file(join(import.meta.dir, "schema.sql"));
  await db`INSERT INTO schema_migrations (id) VALUES (${id})`;
}
