import { isProduction, verifyPayload } from "./secret";

/**
 * The guest ficha cookie.
 *
 * Holds `students.cookie_token`, a random value for one ficha. Same reasoning
 * as the manage link: nothing is derived from a secret, so rotating Clerk
 * cannot log every guest out of their own bookings.
 */
export function cookieName(slug: string): string {
  return `vb_p_${slug}`;
}

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

/** Six months. `Secure` off in dev so http://localhost still keeps the ficha. */
function attributes(): string {
  return `Path=/; HttpOnly; SameSite=Lax${isProduction() ? "; Secure" : ""}`;
}

export function setPlayerCookieHeader(slug: string, cookieToken: string): string {
  return `${cookieName(slug)}=${encodeURIComponent(cookieToken)}; ${attributes()}; Max-Age=15552000`;
}

export function clearPlayerCookieHeader(slug: string): string {
  return `${cookieName(slug)}=; ${attributes()}; Max-Age=0`;
}

/**
 * Cookies set before row tokens existed: `<academyId>.<studentId>.<hmac>`.
 * Read-only support so a returning player keeps their ficha.
 */
export function legacyStudentId(academyId: string, raw: string | undefined): string | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [aid, studentId, mac] = parts;
  if (aid !== academyId || !studentId || !mac) return null;
  if (!verifyPayload(`${academyId}:${studentId}`, mac)) return null;
  return studentId;
}
