/**
 * Secrets used to sign player cookies and WhatsApp manage links.
 *
 * Production must never sign with the constant in this file: anyone reading
 * the repo could forge a link that cancels somebody else's class. A dedicated
 * `PLAYER_COOKIE_SECRET` is the right answer, and `CLERK_SECRET_KEY` is
 * accepted with a warning because that is what these tokens were signed with
 * before — the cost is coupling, not forgeability: rotating Clerk invalidates
 * every manage link already sent.
 *
 * Verification also accepts retired secrets (`PLAYER_COOKIE_SECRET_OLD`, and
 * the Clerk key) so rotating does not invalidate the links already sitting in
 * a player's WhatsApp.
 */
const DEV_FALLBACK = "dev-player-cookie";

let warned = false;

function warnCoupled(): void {
  if (warned) return;
  warned = true;
  console.warn(
    "PLAYER_COOKIE_SECRET ausente: se firma con CLERK_SECRET_KEY. Rotar Clerk invalidaría los enlaces de gestión ya enviados.",
  );
}

export class SecretError extends Error {}

function clean(raw: string | undefined): string | undefined {
  const value = raw?.trim().replace(/^["']|["']$/g, "");
  return value ? value : undefined;
}

export function isProduction(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "production";
}

/** The secret new tokens are signed with. */
export function signingSecret(env: NodeJS.ProcessEnv = process.env): string {
  const primary = clean(env.PLAYER_COOKIE_SECRET);
  if (primary) return primary;
  const clerk = clean(env.CLERK_SECRET_KEY);
  if (clerk) {
    if (isProduction(env)) warnCoupled();
    return clerk;
  }
  if (isProduction(env)) {
    throw new SecretError("PLAYER_COOKIE_SECRET (o CLERK_SECRET_KEY) es obligatorio en producción");
  }
  return DEV_FALLBACK;
}

/** Every secret a token may legitimately have been signed with, newest first. */
export function verifyingSecrets(env: NodeJS.ProcessEnv = process.env): string[] {
  const out: string[] = [signingSecret(env)];
  for (const raw of [env.PLAYER_COOKIE_SECRET_OLD, env.CLERK_SECRET_KEY]) {
    const value = clean(raw);
    if (value && !out.includes(value)) out.push(value);
  }
  if (!isProduction(env) && !out.includes(DEV_FALLBACK)) out.push(DEV_FALLBACK);
  return out;
}

/** Fail fast at boot instead of silently serving forgeable tokens. */
export function assertSecrets(env: NodeJS.ProcessEnv = process.env): void {
  signingSecret(env);
  if (isProduction(env) && !clean(env.CLERK_SECRET_KEY)) {
    throw new SecretError("CLERK_SECRET_KEY es obligatorio en producción");
  }
}

import { createHmac, timingSafeEqual } from "node:crypto";

export function signPayload(payload: string, env: NodeJS.ProcessEnv = process.env): string {
  return createHmac("sha256", signingSecret(env)).update(payload).digest("base64url");
}

/** Constant-time compare against the current secret and any retired one. */
export function verifyPayload(payload: string, mac: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const given = Buffer.from(mac);
  let ok = false;
  for (const secret of verifyingSecrets(env)) {
    const expected = Buffer.from(createHmac("sha256", secret).update(payload).digest("base64url"));
    // No early exit: every candidate is compared so timing does not leak which matched.
    if (given.length === expected.length && timingSafeEqual(given, expected)) ok = true;
  }
  return ok;
}
