import postgres from "postgres";

export type Db = postgres.Sql;

export function connect(url = process.env.DATABASE_URL): Db {
  if (!url) throw new Error("DATABASE_URL is required");
  return postgres(url, { max: 8, idle_timeout: 20, onnotice: () => {} });
}
