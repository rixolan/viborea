import {
  type Db,
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
import { parseCategory, parseSide, type PlayingSide, type StudentCategory } from "./domain/student";
import type { BookingStatus } from "./domain/types";

export type PilotoInput = {
  name: string;
  phone: string;
  category?: StudentCategory;
  side?: PlayingSide | null;
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

export async function pilotoReserva(db: Db, input: PilotoInput, now = new Date()): Promise<PilotoResult> {
  const monday = addDays(mondayOf(now), 7);
  await ensureWeek(db, monday);
  const student = await findOrCreateStudent(db, input.name, input.phone, {
    category: parseCategory(input.category),
    side: input.side === undefined ? undefined : parseSide(input.side),
  });
  if (!(await activePack(db, student.id, "group", now))) {
    await buyPack(db, student.id, "group", 10, now);
  }

  const sessions = (await weekSessions(db, monday)).filter((s) => s.capacity === 4 && s.cancelled === 0);
  let chosen: (typeof sessions)[number] | undefined;
  for (const session of sessions) {
    const [already] = await db`SELECT id FROM bookings WHERE session_id = ${session.id} AND student_id = ${student.id}`;
    if (already) continue;
    chosen = session;
    break;
  }
  if (!chosen) throw new Error("No hay clase grupal libre la semana que viene");

  const booked = await publicBook(db, chosen.id, student.name, student.phone, {
    category: student.category,
    side: student.side,
  });
  if (booked !== "pending_payment") throw new Error(`No se pudo reservar: ${booked}`);

  const [booking] = await db`SELECT id FROM bookings WHERE session_id = ${chosen.id} AND student_id = ${student.id}`;
  if (!booking) throw new Error("Reserva no encontrada");

  const alert = await setBookingStatus(db, String(booking.id), "confirmed");
  if (!alert) throw new Error("La reserva no consumió el paquete");

  return {
    studentId: student.id,
    sessionId: chosen.id,
    bookingId: String(booking.id),
    status: "confirmed",
    remaining: alert.remaining,
    alert,
    offering: chosen.offering_name,
    startsAt: chosen.starts_at,
  };
}
