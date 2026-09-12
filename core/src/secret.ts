/**
 * Legacy verification only.
 *
 * Manage links and the guest cookie used to be an HMAC over a shared secret.
 * They are random per-row tokens now (`bookings.manage_token`,
 * `students.cookie_token`), so nothing here signs anything in production: these
 * secrets exist to keep opening the links handed out before migration 017.
 *
 * Once those classes have passed, `PLAYER_COOKIE_SECRET` can be deleted and
 * this module with it.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const DEV_FALLBACK = "dev-player-cookie";

export class SecretError extends Error {}

function clean(raw: string | undefined): string | undefined {
  const value = raw?.trim().replace(/^["']|["']$/g, "");
  return value ? value : undefined;
}

export function isProduction(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "production";
}

/** Every secret a pre-017 token may have been signed with, newest first. */
export function legacySecrets(env: NodeJS.ProcessEnv = process.env): string[] {
  const out: string[] = [];
  for (const raw of [env.PLAYER_COOKIE_SECRET, env.PLAYER_COOKIE_SECRET_OLD, env.CLERK_SECRET_KEY]) {
    const value = clean(raw);
    if (value && !out.includes(value)) out.push(value);
  }
  if (!isProduction(env) && !out.includes(DEV_FALLBACK)) out.push(DEV_FALLBACK);
  return out;
}

/** Only reachable from tests now: production never signs a new token. */
export function signPayload(payload: string, env: NodeJS.ProcessEnv = process.env): string {
  const [secret] = legacySecrets(env);
  if (!secret) throw new SecretError("No hay secreto para firmar");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Constant-time compare against every secret a legacy token could carry. */
export function verifyPayload(payload: string, mac: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const given = Buffer.from(mac);
  let ok = false;
  for (const secret of legacySecrets(env)) {
    const expected = Buffer.from(createHmac("sha256", secret).update(payload).digest("base64url"));
    // No early exit: every candidate is compared so timing does not leak which matched.
    if (given.length === expected.length && timingSafeEqual(given, expected)) ok = true;
  }
  return ok;
}

/**
 * Staff auth is the one thing that genuinely cannot work without a secret:
 * no Clerk key means no way to tell an academia from the open internet.
 */
export function assertSecrets(env: NodeJS.ProcessEnv = process.env): void {
  if (isProduction(env) && !clean(env.CLERK_SECRET_KEY)) {
    throw new SecretError("CLERK_SECRET_KEY es obligatorio en producción");
  }
}
