import { isProduction, signPayload, verifyPayload } from "./secret";

function payload(academyId: string, studentId: string): string {
  return `${academyId}:${studentId}`;
}

export function cookieName(slug: string): string {
  return `vb_p_${slug}`;
}

export function encodePlayerCookie(academyId: string, studentId: string): string {
  return `${academyId}.${studentId}.${signPayload(payload(academyId, studentId))}`;
}

export function decodePlayerCookie(academyId: string, raw: string | undefined): string | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [aid, studentId, mac] = parts;
  if (aid !== academyId || !studentId || !mac) return null;
  if (!verifyPayload(payload(academyId, studentId), mac)) return null;
  return studentId;
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

export function setPlayerCookieHeader(slug: string, academyId: string, studentId: string): string {
  const value = encodeURIComponent(encodePlayerCookie(academyId, studentId));
  return `${cookieName(slug)}=${value}; ${attributes()}; Max-Age=15552000`;
}

export function clearPlayerCookieHeader(slug: string): string {
  return `${cookieName(slug)}=; ${attributes()}; Max-Age=0`;
}
