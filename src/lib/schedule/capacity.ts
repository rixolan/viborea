import type { BookingStatus } from "@/types/database";
import { OCCUPYING_BOOKING_STATUSES } from "./types";

export function occupyingCount(
  bookings: readonly { status: BookingStatus }[],
): number {
  let n = 0;
  for (const booking of bookings) {
    if (OCCUPYING_BOOKING_STATUSES.has(booking.status)) n += 1;
  }
  return n;
}

export function remainingCapacity(
  capacity: number,
  bookings: readonly { status: BookingStatus }[],
): number {
  return Math.max(0, capacity - occupyingCount(bookings));
}

export function canAcceptBooking(
  capacity: number,
  bookings: readonly { status: BookingStatus }[],
): boolean {
  return remainingCapacity(capacity, bookings) > 0;
}

/** Confirmed path vs waitlist. Prepaid bookings still occupy via pending_payment. */
export function nextBookingStatus(
  capacity: number,
  bookings: readonly { status: BookingStatus }[],
): "pending_payment" | "waitlisted" {
  return canAcceptBooking(capacity, bookings) ? "pending_payment" : "waitlisted";
}
