import { describe, expect, it } from "bun:test";
import { legacyBookingId, manageUrl } from "./manage-link";
import { signPayload } from "./secret";

/** How links were built before `bookings.manage_token` existed. */
function legacyLink(academyId: string, bookingId: string): string {
  return `${bookingId}.${signPayload(`${academyId}:${bookingId}`)}`;
}

describe("manage link", () => {
  it("es el token de la reserva, sin secreto de por medio", () => {
    const url = manageUrl("academiadg", "3f2504e0-4f89-41d3-9a0c-0305e82c3301");
    expect(url.endsWith("/reservar/academiadg/turno/3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBe(true);
  });

  it("sigue abriendo los enlaces firmados ya enviados", () => {
    const token = legacyLink("academy-a", "booking-1");
    expect(legacyBookingId("academy-a", token)).toBe("booking-1");
    expect(legacyBookingId("academy-b", token)).toBeNull();
    expect(legacyBookingId("academy-a", "booking-1.nope")).toBeNull();
  });

  it("un token de fila no se confunde con uno firmado", () => {
    expect(legacyBookingId("academy-a", "3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBeNull();
  });
});
