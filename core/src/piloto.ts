import {
  type Db,
  academyById,
  activePack,
  buyPack,
  findOrCreateStudent,
  publicBook,
  setBookingStatus,
  weekGrid,
  weekOfAcademy,
} from "./db";
import { addDaysToKey } from "./domain/timezone";
import type { PackAlert } from "./domain/pack";
import { parseCategory, parseSide, type PlayingSide, type StudentCategory } from "./domain/student";
import type { BookingStatus } from "./domain/types";
import { DG_ACADEMY_ID } from "./seed";

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
  const academyId = DG_ACADEMY_ID;
  // Next week as the academia's calendar sees it, not as UTC does.
  const monday = addDaysToKey(weekOfAcademy(await academyById(db, academyId), now).mondayKey, 7);
  const student = await findOrCreateStudent(db, academyId, input.name, input.phone, {
    category: parseCategory(input.category),
    side: input.side === undefined ? undefined : parseSide(input.side),
  });
  if (!(await activePack(db, student.id, "group", now))) {
    await buyPack(db, student.id, "group", 10, now);
  }

  const sessions = (await weekGrid(db, academyId, monday)).filter(
    (s) =>
      s.cancelled === 0 &&
      s.booked < s.capacity &&
      (s.source === "availability" || s.capacity === 4) &&
      new Date(s.starts_at).getTime() > now.getTime() + 13 * 60 * 60 * 1000,
  );
  const chosen = sessions[0];
  if (!chosen) throw new Error("No hay clase grupal libre la semana que viene");

  const booked = await publicBook(db, academyId, chosen.id, student.name, student.phone, {
    category: student.category,
    side: student.side,
    offeringId: "off-grupal",
  });
  if (booked.status !== "pending_payment") throw new Error(`No se pudo reservar: ${booked.status}`);

  const [booking] = await db`SELECT id FROM bookings WHERE session_id = ${booked.sessionId} AND student_id = ${student.id}`;
  if (!booking) throw new Error("Reserva no encontrada");

  const alert = await setBookingStatus(db, academyId, String(booking.id), "confirmed");
  if (!alert) throw new Error("La reserva no consumió el paquete");

  return {
    studentId: student.id,
    sessionId: booked.sessionId,
    bookingId: String(booking.id),
    status: "confirmed",
    remaining: alert.remaining,
    offering: "Grupal",
    startsAt: chosen.starts_at,
    alert,
  };
}
