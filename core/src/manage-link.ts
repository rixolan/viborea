import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  return process.env.PLAYER_COOKIE_SECRET ?? process.env.CLERK_SECRET_KEY ?? "dev-player-cookie";
}

function sign(academyId: string, bookingId: string): string {
  return createHmac("sha256", secret()).update(`${academyId}:${bookingId}`).digest("base64url");
}

export function encodeManageToken(academyId: string, bookingId: string): string {
  return `${bookingId}.${sign(academyId, bookingId)}`;
}

export function decodeManageToken(academyId: string, token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const bookingId = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!bookingId || !mac) return null;
  const expected = sign(academyId, bookingId);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return bookingId;
}

export function publicOrigin(): string {
  const raw = process.env.APP_URL ?? process.env.FRONTEND_URL ?? "https://viborea.com";
  return raw.replace(/\/$/, "");
}

export function manageUrl(slug: string, academyId: string, bookingId: string): string {
  return `${publicOrigin()}/reservar/${slug}/turno/${encodeManageToken(academyId, bookingId)}`;
}
