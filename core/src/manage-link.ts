import { signPayload, verifyPayload } from "./secret";

function payload(academyId: string, bookingId: string): string {
  return `${academyId}:${bookingId}`;
}

export function encodeManageToken(academyId: string, bookingId: string): string {
  return `${bookingId}.${signPayload(payload(academyId, bookingId))}`;
}

export function decodeManageToken(academyId: string, token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const bookingId = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!bookingId || !mac) return null;
  if (!verifyPayload(payload(academyId, bookingId), mac)) return null;
  return bookingId;
}

export function publicOrigin(): string {
  const raw = process.env.APP_URL ?? process.env.FRONTEND_URL ?? "https://viborea.com";
  return raw.replace(/\/$/, "");
}

export function manageUrl(slug: string, academyId: string, bookingId: string): string {
  return `${publicOrigin()}/reservar/${slug}/turno/${encodeManageToken(academyId, bookingId)}`;
}
