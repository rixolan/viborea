import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  return process.env.PLAYER_COOKIE_SECRET ?? process.env.CLERK_SECRET_KEY ?? "dev-player-cookie";
}

function sign(academyId: string, studentId: string): string {
  return createHmac("sha256", secret()).update(`${academyId}:${studentId}`).digest("base64url");
}

export function cookieName(slug: string): string {
  return `vb_p_${slug}`;
}

export function encodePlayerCookie(academyId: string, studentId: string): string {
  return `${academyId}.${studentId}.${sign(academyId, studentId)}`;
}

export function decodePlayerCookie(academyId: string, raw: string | undefined): string | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [aid, studentId, mac] = parts;
  if (aid !== academyId || !studentId || !mac) return null;
  const expected = sign(academyId, studentId);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
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

export function setPlayerCookieHeader(slug: string, academyId: string, studentId: string): string {
  const value = encodeURIComponent(encodePlayerCookie(academyId, studentId));
  return `${cookieName(slug)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=15552000`;
}

export function clearPlayerCookieHeader(slug: string): string {
  return `${cookieName(slug)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
