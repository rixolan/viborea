import { beforeAll, describe, expect, it } from "bun:test";
import { handleApi } from "./api";
import { signPayload } from "./secret";
import { DG_ACADEMY_ID } from "./seed";
import {
  WEEKDAYS,
  activePack,
  buyPack,
  cancelSession,
  createAvailability,
  createCoach,
  createCourt,
  createLocation,
  createOffering,
  createSession,
  createTemplate,
  deleteAvailability,
  expireStaleHolds,
  findOrCreateStudent,
  listAvailability,
  manageBookingByToken,
  studentByCookieToken,
  openDb,
  publicBook,
  selfServeCancel,
  selfServeReschedule,
  setBookingStatus,
  updateAcademySettings,
  weekGrid,
  type Db,
  type SessionView,
} from "./db";
import { OverlapError } from "./domain/types";
import { addDaysToKey, dateKeyIn, instantFrom, mondayKeyIn } from "./domain/timezone";

const url = process.env.DATABASE_URL;
const ACADEMY = "academy-rel-test";
const TZ = "America/Asuncion";

let db: Db;
let loc = "";
let courtA = "";
let courtB = "";
let coachA = "";
let coachB = "";
let individual = "";
let grupal = "";
let phones = 0;

/** A Paraguayan mobile nobody else in the suite will claim: 9 national digits. */
function phone(): string {
  phones += 1;
  return `+59598${`${Date.now()}${phones}`.slice(-7)}`;
}

function monday(weeksAhead = 2): string {
  return addDaysToKey(mondayKeyIn(TZ, new Date()), 7 * weeksAhead);
}

async function holes(weeksAhead = 2): Promise<SessionView[]> {
  const grid = await weekGrid(db, ACADEMY, monday(weeksAhead));
  return grid.filter((s) => s.source === "availability");
}

async function wipe(): Promise<void> {
  await db`DELETE FROM pack_alerts WHERE student_id IN (SELECT id FROM students WHERE academy_id = ${ACADEMY})`;
  await db`DELETE FROM bookings WHERE session_id IN (SELECT id FROM sessions WHERE academy_id = ${ACADEMY})`;
  await db`DELETE FROM packs WHERE student_id IN (SELECT id FROM students WHERE academy_id = ${ACADEMY})`;
  await db`DELETE FROM sessions WHERE academy_id = ${ACADEMY}`;
  await db`DELETE FROM templates WHERE academy_id = ${ACADEMY}`;
  await db`DELETE FROM coach_availability WHERE academy_id = ${ACADEMY}`;
  await db`DELETE FROM students WHERE academy_id = ${ACADEMY}`;
  await db`DELETE FROM courts WHERE academy_id = ${ACADEMY}`;
  await db`DELETE FROM coaches WHERE academy_id = ${ACADEMY}`;
  await db`DELETE FROM offerings WHERE academy_id = ${ACADEMY}`;
  await db`DELETE FROM locations WHERE academy_id = ${ACADEMY}`;
  await db`DELETE FROM academy WHERE id = ${ACADEMY}`;
}

describe.skipIf(!url)("garantías de reserva", () => {
  beforeAll(async () => {
    db = await openDb(url);
    await wipe();
    await db`
      INSERT INTO academy (id, slug, name, locale, currency, timezone, cutoff_hours, hold_minutes)
      VALUES (${ACADEMY}, 'reltest', 'Rel Test', 'es-PY', 'PYG', ${TZ}, 12, 0)
    `;
    loc = await createLocation(db, ACADEMY, { name: "Sede Test" });
    courtA = await createCourt(db, ACADEMY, { locationId: loc, name: "Cancha 1", number: 1 });
    courtB = await createCourt(db, ACADEMY, { locationId: loc, name: "Cancha 2", number: 2 });
    coachA = await createCoach(db, ACADEMY, { name: "Profe A", languages: ["es"] });
    coachB = await createCoach(db, ACADEMY, { name: "Profe B", languages: "es, pt" });
    individual = await createOffering(db, ACADEMY, { name: "Individual", capacity: 1, durationMinutes: 60, price: 150000 });
    grupal = await createOffering(db, ACADEMY, { name: "Grupal", capacity: 2, durationMinutes: 60, price: 100000 });
    for (const weekday of WEEKDAYS) {
      await createAvailability(db, ACADEMY, {
        coachId: coachA,
        locationId: loc,
        weekday,
        startTime: "06:00",
        endTime: "11:00",
      });
    }
  });

  it("el hueco guarda la hora local de la sede, no UTC", async () => {
    const open = await holes();
    expect(open.length).toBeGreaterThan(0);
    const first = open[0];
    expect(first.local_time).toBe("06:00");
    expect(first.time_zone).toBe(TZ);
    // 06:00 en Asunción es 09:00Z. Antes se guardaba 06:00Z y todo el cutoff
    // corría tres horas antes de tiempo.
    expect(new Date(first.starts_at).toISOString()).toBe(`${first.local_date}T09:00:00.000Z`);
    expect(dateKeyIn(TZ, new Date(first.starts_at))).toBe(first.local_date);
  });

  it("Postgres rechaza el solape de cancha y de profe", async () => {
    const startsAt = instantFrom(monday(3), "07:00", TZ);
    await createSession(db, ACADEMY, { offeringId: individual, courtId: courtA, coachId: coachA, startsAt });
    // misma cancha, otro profe
    await expect(
      createSession(db, ACADEMY, { offeringId: individual, courtId: courtA, coachId: coachB, startsAt }),
    ).rejects.toBeInstanceOf(OverlapError);
    // mismo profe, otra cancha
    await expect(
      createSession(db, ACADEMY, { offeringId: individual, courtId: courtB, coachId: coachA, startsAt }),
    ).rejects.toBeInstanceOf(OverlapError);
    // hora pegada: no se solapa
    await expect(
      createSession(db, ACADEMY, {
        offeringId: individual,
        courtId: courtA,
        coachId: coachA,
        startsAt: instantFrom(monday(3), "08:00", TZ),
      }),
    ).resolves.toBeTruthy();
  });

  it("dos jugadores a la vez sobre el mismo hueco no duplican la clase", async () => {
    const hole = (await holes()).find((h) => h.local_time === "09:00")!;
    const [a, b] = await Promise.all([
      publicBook(db, ACADEMY, hole.id, "Ana Paralela", phone(), { offeringId: grupal }),
      publicBook(db, ACADEMY, hole.id, "Bruno Paralelo", phone(), { offeringId: grupal }),
    ]);
    expect(a.sessionId).toBe(b.sessionId);
    const rows = await db`
      SELECT id FROM sessions
      WHERE academy_id = ${ACADEMY} AND starts_at = ${new Date(hole.starts_at)} AND cancelled = false
    `;
    expect(rows.length).toBe(1);
    const [count] = await db`
      SELECT COUNT(*)::int AS n FROM bookings
      WHERE session_id = ${a.sessionId} AND status IN ('pending_payment', 'confirmed', 'checked_in')
    `;
    expect(Number(count.n)).toBe(2);
  });

  it("el último cupo lo gana uno solo", async () => {
    const hole = (await holes()).find((h) => h.local_time === "10:00")!;
    const results = await Promise.allSettled([
      publicBook(db, ACADEMY, hole.id, "Uno", phone(), { offeringId: individual }),
      publicBook(db, ACADEMY, hole.id, "Dos", phone(), { offeringId: individual }),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");
    expect(ok.length).toBe(1);
    expect(failed.length).toBe(1);
    expect(String((failed[0] as PromiseRejectedResult).reason?.message)).toMatch(/completa/i);
  });

  it("cancelar y volver a anotarse en la misma clase funciona", async () => {
    const hole = (await holes(3)).find((h) => h.local_time === "06:00")!;
    const number = phone();
    const first = await publicBook(db, ACADEMY, hole.id, "Vuelve", number, { offeringId: individual });
    await selfServeCancel(db, ACADEMY, first.bookingId, first.student.id);
    const again = await publicBook(db, ACADEMY, hole.id, "Vuelve", number, {
      offeringId: individual,
      cookieStudentId: first.student.id,
    });
    expect(again.sessionId).toBe(first.sessionId);
    expect(again.status).toBe("pending_payment");
    const [count] = await db`
      SELECT COUNT(*)::int AS n FROM bookings WHERE session_id = ${first.sessionId} AND student_id = ${first.student.id}
    `;
    expect(Number(count.n)).toBe(1);
  });

  it("cancelar la clase cancela las reservas y devuelve la clase del pack", async () => {
    const hole = (await holes(3)).find((h) => h.local_time === "07:00")!;
    const booked = await publicBook(db, ACADEMY, hole.id, "Con Pack", phone(), { offeringId: individual });
    await buyPack(db, booked.student.id, "individual", 5);
    const alert = await setBookingStatus(db, ACADEMY, booked.bookingId, "confirmed");
    expect(alert?.remaining).toBe(4);

    const cancelled = await cancelSession(db, ACADEMY, booked.sessionId);
    expect(cancelled?.affected.map((a) => a.booking_id)).toEqual([booked.bookingId]);
    expect(cancelled?.affected[0]?.phone).toBe(booked.student.phone);
    const [row] = await db`SELECT status FROM bookings WHERE id = ${booked.bookingId}`;
    expect(row.status).toBe("cancelled");
    expect((await activePack(db, booked.student.id, "individual"))?.remaining).toBe(5);
    const [session] = await db`SELECT cancelled FROM sessions WHERE id = ${booked.sessionId}`;
    expect(session.cancelled).toBe(true);
    expect(await cancelSession(db, ACADEMY, booked.sessionId)).toBeNull();
  });

  it("reprogramar deja una sola reserva viva", async () => {
    const open = await holes(4);
    const from = open.find((h) => h.local_time === "06:00")!;
    const to = open.find((h) => h.local_time === "08:00")!;
    const booked = await publicBook(db, ACADEMY, from.id, "Mueve", phone(), { offeringId: individual });
    const moved = await selfServeReschedule(db, ACADEMY, booked.bookingId, booked.student.id, to.id, individual);
    expect(moved.sessionId).not.toBe(booked.sessionId);
    const rows = await db`
      SELECT s.starts_at FROM bookings b JOIN sessions s ON s.id = b.session_id
      WHERE b.student_id = ${booked.student.id} AND b.status IN ('pending_payment', 'confirmed', 'checked_in')
    `;
    expect(rows.length).toBe(1);
    expect(new Date(String(rows[0].starts_at)).toISOString()).toBe(new Date(to.starts_at).toISOString());
  });

  it("el hold vencido libera el cupo", async () => {
    await updateAcademySettings(db, ACADEMY, { hold_minutes: 30 });
    const hole = (await holes(4)).find((h) => h.local_time === "10:00")!;
    const booked = await publicBook(db, ACADEMY, hole.id, "Sin Pagar", phone(), { offeringId: individual });
    await db`UPDATE bookings SET created_at = now() - INTERVAL '2 hours' WHERE id = ${booked.bookingId}`;
    const expired = await expireStaleHolds(db);
    expect(expired.map((h) => h.booking_id)).toContain(booked.bookingId);
    const [row] = await db`SELECT status FROM bookings WHERE id = ${booked.bookingId}`;
    expect(row.status).toBe("cancelled");
    await updateAcademySettings(db, ACADEMY, { hold_minutes: 0 });
    expect((await expireStaleHolds(db)).length).toBe(0);
  });

  it("la academia edita su disponibilidad sin desplegar código", async () => {
    const before = await listAvailability(db, ACADEMY);
    const id = await createAvailability(db, ACADEMY, {
      coachId: coachB,
      locationId: loc,
      weekday: "monday",
      startTime: "15:00",
      endTime: "18:00",
    });
    const after = await listAvailability(db, ACADEMY);
    expect(after.length).toBe(before.length + 1);
    expect(after.find((row) => row.id === id)?.coach_name).toBe("Profe B");

    // el mismo profe no puede estar en dos lados a la vez
    await expect(
      createAvailability(db, ACADEMY, {
        coachId: coachB,
        locationId: loc,
        weekday: "monday",
        startTime: "17:00",
        endTime: "19:00",
      }),
    ).rejects.toThrow(/ya está/i);
    // ni bloques de menos de una hora, ni días inventados
    await expect(
      createAvailability(db, ACADEMY, {
        coachId: coachB,
        locationId: loc,
        weekday: "tuesday",
        startTime: "15:00",
        endTime: "15:30",
      }),
    ).rejects.toThrow(/una hora/i);
    await expect(
      createAvailability(db, ACADEMY, { coachId: coachB, locationId: loc, weekday: "lunes", startTime: "15:00", endTime: "16:00" }),
    ).rejects.toThrow(/inválido/i);

    await deleteAvailability(db, ACADEMY, id);
    expect((await listAvailability(db, ACADEMY)).length).toBe(before.length);
  });

  it("un profe no aparece en dos sedes a la misma hora", async () => {
    // La disponibilidad sembrada de DG tiene bloques así, y ofrecer los dos
    // huecos termina en un error de solape al reservar el segundo.
    const other = await createLocation(db, ACADEMY, { name: "Sede Paralela" });
    await createCourt(db, ACADEMY, { locationId: other, name: "Cancha 1", number: 1 });
    await db`
      INSERT INTO coach_availability (id, academy_id, coach_id, location_id, weekday, start_time, end_time)
      VALUES (${"av-clash-test"}, ${ACADEMY}, ${coachA}, ${other}, 'monday', '08:00', '10:00')
    `;
    const grid = await weekGrid(db, ACADEMY, monday(5));
    const mondayHoles = grid.filter((s) => s.source === "availability" && s.local_date === monday(5));
    const keys = mondayHoles.map((s) => `${s.coach_id}|${s.local_time}`);
    expect(keys.length).toBe(new Set(keys).size);
    expect(mondayHoles.some((s) => s.location_id === other)).toBe(false);
    await db`DELETE FROM coach_availability WHERE id = ${"av-clash-test"}`;
  });

  it("el enlace de gestión es un token de la reserva, no un HMAC", async () => {
    const hole = (await holes(5)).find((h) => h.local_time === "09:00")!;
    const booked = await publicBook(db, ACADEMY, hole.id, "Con Enlace", phone(), { offeringId: individual });
    expect(booked.manageToken).toMatch(/^[0-9a-f-]{36}$/);

    const found = await manageBookingByToken(db, ACADEMY, booked.manageToken);
    expect(found?.id).toBe(booked.bookingId);
    expect(found?.manage_token).toBe(booked.manageToken);
    // el token de una academia no abre nada en otra
    expect(await manageBookingByToken(db, DG_ACADEMY_ID, booked.manageToken)).toBeNull();
    expect(await manageBookingByToken(db, ACADEMY, "3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBeNull();

    const open = async (t: string) =>
      (await handleApi(new Request(`http://localhost/api/a/reltest/manage/${encodeURIComponent(t)}`), db))?.status;
    expect(await open(booked.manageToken)).toBe(200);

    // Pasar Clerk de test a live cambia CLERK_SECRET_KEY, que es lo que firmaba
    // los enlaces anteriores: esos mueren, y es justamente por eso que el
    // enlace nuevo no depende de ningún secreto.
    const clerkBefore = process.env.CLERK_SECRET_KEY;
    const cookieBefore = process.env.PLAYER_COOKIE_SECRET;
    delete process.env.PLAYER_COOKIE_SECRET;
    try {
      process.env.CLERK_SECRET_KEY = "sk_test_antes";
      const legacy = `${booked.bookingId}.${signPayload(`${ACADEMY}:${booked.bookingId}`)}`;
      expect(await open(legacy)).toBe(200);

      process.env.CLERK_SECRET_KEY = "sk_live_despues";
      expect(await open(legacy)).toBe(404);
      expect(await open(booked.manageToken)).toBe(200);
    } finally {
      if (clerkBefore === undefined) delete process.env.CLERK_SECRET_KEY;
      else process.env.CLERK_SECRET_KEY = clerkBefore;
      if (cookieBefore === undefined) delete process.env.PLAYER_COOKIE_SECRET;
      else process.env.PLAYER_COOKIE_SECRET = cookieBefore;
    }
  });

  it("la cookie de la ficha también es un token de fila", async () => {
    const student = await findOrCreateStudent(db, ACADEMY, "Ficha Token", phone());
    expect(student.cookie_token).toMatch(/^[0-9a-f-]{36}$/);
    expect((await studentByCookieToken(db, ACADEMY, student.cookie_token))?.id).toBe(student.id);
    expect(await studentByCookieToken(db, ACADEMY, "no-existe")).toBeNull();
    expect(await studentByCookieToken(db, DG_ACADEMY_ID, student.cookie_token)).toBeNull();

    // reservar con esa cookie reconoce la misma ficha, sin nombre ni teléfono
    const hole = (await holes(5)).find((h) => h.local_time === "10:00")!;
    const booked = await publicBook(db, ACADEMY, hole.id, "", "", {
      offeringId: individual,
      cookieToken: student.cookie_token,
    });
    expect(booked.student.id).toBe(student.id);
  });

  it("la planilla madre no acepta una fila que se solapa", async () => {
    await createTemplate(db, ACADEMY, {
      offeringId: grupal,
      locationId: loc,
      courtId: courtA,
      coachId: coachB,
      weekday: "wednesday",
      startTime: "19:00",
    });
    await expect(
      createTemplate(db, ACADEMY, {
        offeringId: grupal,
        locationId: loc,
        courtId: courtA,
        coachId: coachA,
        weekday: "wednesday",
        startTime: "19:00",
      }),
    ).rejects.toThrow(/solapa/i);
    await expect(
      createTemplate(db, ACADEMY, {
        offeringId: grupal,
        locationId: loc,
        courtId: courtB,
        coachId: coachB,
        weekday: "wednesday",
        startTime: "19:30",
      }),
    ).rejects.toThrow(/solapa/i);
  });
});
