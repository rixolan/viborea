import { verifyPayload } from "./secret";

/**
 * The manage link a player gets over WhatsApp.
 *
 * The token is `bookings.manage_token`: a random value that identifies exactly
 * one booking. It is not derived from anything, so no secret has to survive a
 * rotation for the links already sent to keep working.
 */
export function manageUrl(slug: string, manageToken: string): string {
  return `${publicOrigin()}/reservar/${slug}/turno/${manageToken}`;
}

export function publicOrigin(): string {
  const raw = process.env.APP_URL ?? process.env.FRONTEND_URL ?? "https://viborea.com";
  return raw.replace(/\/$/, "");
}

/**
 * Links handed out before row tokens existed: `<bookingId>.<hmac>`. Kept so
 * the ones already in a player's chat still open. Nothing new is signed.
 */
export function legacyBookingId(academyId: string, token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const bookingId = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!bookingId || !mac) return null;
  if (!verifyPayload(`${academyId}:${bookingId}`, mac)) return null;
  return bookingId;
}
