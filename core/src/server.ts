import {
  MAX_REMINDER_ATTEMPTS,
  dueReminders,
  expireStaleHolds,
  markReminded,
  markReminderFailed,
  openDb,
} from "./db";
import { seedIfEmpty, alignCatalog } from "./seed";
import { configFromEnv as whatsappConfig, notifyReservation } from "./notify/whatsapp";
import { manageUrl, publicOrigin } from "./manage-link";
import { pilotoReserva } from "./piloto";
import { parseCategory, parseSide } from "./domain/student";
import { dateKeyIn, timeIn } from "./domain/timezone";
import { assertSecrets, isProduction } from "./secret";
import { handleApi } from "./api";
import { handleTpagoHook } from "./payments/tpago";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Fail at boot, not on the first forged manage link.
assertSecrets();

const DIST = join(import.meta.dir, "../../web/dist");
const HAS_DIST = existsSync(DIST);
const PORT = Number(process.env.PORT ?? 3000);
const PILOTO = process.env.PILOTO_ENABLED === "1" || !isProduction();

const db = await openDb();
await seedIfEmpty(db);
// `alignCatalog` rewrites the DG roster from source and drops that academy's
// templates and availability, so it is a deliberate command, not a boot step.
if (process.env.SEED_ALIGN_DG === "1") {
  console.log("seed: alineando el catálogo de Academia DG");
  await alignCatalog(db);
}

const wa = whatsappConfig();
if (!wa) console.warn("WhatsApp sin configurar: avisos y recordatorios quedan en dry-run");

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

/**
 * Everything Vite emits under `assets/` carries a content hash in its name
 * (`index-o_RU9OUK.js`), so it can never change under the same URL. Files
 * served from anywhere else — the coach portraits in `public/` — can.
 */
function assetHeaders(path: string): Record<string, string> {
  return path.startsWith("assets/")
    ? { "cache-control": "public, max-age=31536000, immutable" }
    : { "cache-control": "public, max-age=3600" };
}

async function serveSpa(pathname: string): Promise<Response | null> {
  if (!HAS_DIST) return null;
  const rel = pathname.replace(/^\/+/, "");
  if (rel.includes("..")) return new Response("No encontrada", { status: 404 });
  if (rel.includes(".")) {
    const asset = Bun.file(join(DIST, rel));
    if (await asset.exists()) return new Response(asset, { headers: assetHeaders(rel) });
    if (rel.startsWith("assets/")) return new Response("No encontrada", { status: 404 });
  }
  return new Response(Bun.file(join(DIST, "index.html")), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
  });
}

async function pilotoRun(req: Request): Promise<Response> {
  if (!PILOTO) return json({ error: "No encontrada" }, 404);
  const input = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
    category?: string;
    side?: string;
  };
  try {
    const result = await pilotoReserva(db, {
      name: input.name ?? "",
      phone: input.phone ?? "",
      category: parseCategory(input.category),
      side: parseSide(input.side),
    });
    const sent = await notifyReservation(wa, input.phone ?? "", result.alert.message);
    return json({ ...result, whatsapp: sent.channel, whatsappOk: sent.ok, whatsappError: sent.error });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Error" }, 400);
  }
}

const server = Bun.serve({
  hostname: "0.0.0.0",
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const started = Date.now();
    const response = await route(req, url);
    if (!url.pathname.startsWith("/assets/") && url.pathname !== "/api/health") {
      console.log(`${req.method} ${url.pathname} ${response.status} ${Date.now() - started}ms`);
    }
    return response;
  },
  error(err) {
    // Never leak a stack trace to a player mid-booking.
    console.error("unhandled", err);
    return json({ error: "Error del servidor" }, 500);
  },
});

async function route(req: Request, url: URL): Promise<Response> {
  if (req.method === "POST" && url.pathname === "/hooks/tpago") {
    return handleTpagoHook(req);
  }
  if (req.method === "POST" && (url.pathname === "/api/piloto" || url.pathname === "/piloto/reserva")) {
    return pilotoRun(req);
  }
  const api = await handleApi(req, db);
  if (api) return api;
  if (req.method === "GET" || req.method === "HEAD") {
    const spa = await serveSpa(url.pathname);
    if (spa) return spa;
  }
  return json({ error: "No encontrada" }, 404);
}

console.log(`Viborea :${PORT} → ${publicOrigin()}${HAS_DIST ? "" : " (sin web/dist: solo API)"}`);

async function tickReminders(): Promise<void> {
  const due = await dueReminders(db);
  if (!due.length) return;
  if (!wa) {
    console.log(`recordatorios: ${due.length} pendientes, WhatsApp en dry-run (no se marcan como enviados)`);
    return;
  }
  for (const row of due) {
    const link = manageUrl(row.slug, row.manage_token);
    const when = timeIn(row.timezone, new Date(row.starts_at));
    const text = `Viborea: mañana ${row.offering_name} ${when} con ${row.coach_name} en ${row.location_name}. Cancelá o reprogramá (hasta ${row.cutoff_hours} h antes): ${link}`;
    const sent = await notifyReservation(wa, row.phone, text);
    // Only a delivered free-text message is a reminder. The hello_world
    // fallback carries none of this, so it does not count as sent.
    if (sent.ok && sent.channel === "text") {
      await markReminded(db, row.id);
      continue;
    }
    const attempts = await markReminderFailed(db, row.id);
    console.warn(
      `recordatorio ${row.id} no entregado (${sent.channel}): ${sent.error ?? "sin detalle"} — intento ${attempts}/${MAX_REMINDER_ATTEMPTS}`,
    );
  }
}

async function tickHolds(): Promise<void> {
  const expired = await expireStaleHolds(db);
  for (const hold of expired) {
    const starts = new Date(hold.starts_at);
    const when = `${dateKeyIn(hold.timezone, starts)} ${timeIn(hold.timezone, starts)}`;
    console.log(`hold vencido: ${hold.booking_id} (${hold.slug})`);
    await notifyReservation(
      wa,
      hold.phone,
      `Viborea: liberamos tu lugar en ${hold.offering_name} del ${when} porque quedó sin pagar. Podés reservar de nuevo: ${publicOrigin()}/reservar/${hold.slug}`,
    );
  }
}

async function tick(): Promise<void> {
  try {
    await tickHolds();
  } catch (err) {
    console.error("holds", err);
  }
  try {
    await tickReminders();
  } catch (err) {
    console.error("reminders", err);
  }
}

const timer = setInterval(() => void tick(), 60_000);
void tick();

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    clearInterval(timer);
    void server.stop(true).then(() => db.end({ timeout: 5 })).finally(() => process.exit(0));
  });
}
