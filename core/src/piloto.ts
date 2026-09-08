import type { Database } from "bun:sqlite";
import {
  activePack,
  addDays,
  buyPack,
  ensureWeek,
  findOrCreateStudent,
  mondayOf,
  publicBook,
  setBookingStatus,
  weekSessions,
} from "./db";
import type { PackAlert } from "./domain/pack";
import type { BookingStatus } from "./domain/types";

export type PilotoInput = {
  name: string;
  phone: string;
};

export type PilotoResult = {
  studentId: string;
  sessionId: string;
  bookingId: string;
  status: BookingStatus;
  remaining: number;
  alert: PackAlert;
  offering: string;
  startsAt: string;
};

export function pilotoReserva(db: Database, input: PilotoInput, now = new Date()): PilotoResult {
  const monday = addDays(mondayOf(now), 7);
  ensureWeek(db, monday);
  const student = findOrCreateStudent(db, input.name, input.phone);
  if (!activePack(db, student.id, "group", now)) {
    buyPack(db, student.id, "group", 10, now);
  }

  const sessions = weekSessions(db, monday).filter((s) => s.capacity === 4 && s.cancelled === 0);
  let chosen: (typeof sessions)[number] | undefined;
  for (const session of sessions) {
    const already = db
      .query("SELECT id FROM bookings WHERE session_id = ? AND student_id = ?")
      .get(session.id, student.id);
    if (already) continue;
    chosen = session;
    break;
  }
  if (!chosen) throw new Error("No hay clase grupal libre la semana que viene");

  const booked = publicBook(db, chosen.id, student.name, student.phone);
  if (booked !== "pending_payment") throw new Error(`No se pudo reservar: ${booked}`);

  const booking = db
    .query("SELECT id FROM bookings WHERE session_id = ? AND student_id = ?")
    .get(chosen.id, student.id) as { id: string } | null;
  if (!booking) throw new Error("Reserva no encontrada");

  const alert = setBookingStatus(db, booking.id, "confirmed");
  if (!alert) throw new Error("La reserva no consumió el paquete");

  return {
    studentId: student.id,
    sessionId: chosen.id,
    bookingId: booking.id,
    status: "confirmed",
    remaining: alert.remaining,
    alert,
    offering: chosen.offering_name,
    startsAt: chosen.starts_at,
  };
}
