import { describe, expect, it } from "bun:test";
import { OverlapError } from "./domain/types";
import { handleApi } from "./api";
import {
  academyById,
  activePack,
  addDays,
  bookStudent,
  buyPack,
  catalogs,
  ClaimedFichaError,
  listAcademies,
  createSession,
  ensureWeek,
  findOrCreateStudent,
  identifyPlayer,
  mondayOf,
  openDb,
  publicBook,
  setBookingStatus,
  studentAlerts,
  updateCutoffHours,
  weekGrid,
  weekSessions,
} from "./db";
import { alignCatalog, DG_ACADEMY_ID, seedIfEmpty, WP_ACADEMY_ID } from "./seed";

const url = process.env.DATABASE_URL;

async function ready(db: Awaited<ReturnType<typeof openDb>>) {
  await seedIfEmpty(db);
  await alignCatalog(db);
}

describe.skipIf(!url)("postgres + solape", () => {
  it("rechaza dos clases en la misma pista", async () => {
    const db = await openDb(url);
    await ready(db);
    const monday = mondayOf(new Date("2032-03-01T00:00:00.000Z"));
    const to = addDays(monday, 7);
    const startsAt = new Date("2032-03-01T06:00:00.000Z");
    await db`DELETE FROM bookings WHERE session_id IN (
      SELECT id FROM sessions WHERE academy_id = ${DG_ACADEMY_ID} AND starts_at >= ${monday} AND starts_at < ${to}
    )`;
    await db`DELETE FROM sessions WHERE academy_id = ${DG_ACADEMY_ID} AND starts_at >= ${monday} AND starts_at < ${to}`;
    await createSession(db, DG_ACADEMY_ID, {
      offeringId: "off-individual",
      courtId: "court-costanera-1",
      coachId: "coach-fernando-laval",
      startsAt,
      dayWindow: { from: monday, to },
    });
    await expect(
      createSession(db, DG_ACADEMY_ID, {
        offeringId: "off-grupal",
        courtId: "court-costanera-1",
        coachId: "coach-pablo-recalde",
        startsAt,
        dayWindow: { from: monday, to },
      }),
    ).rejects.toBeInstanceOf(OverlapError);
    await db.end();
  });
});

describe.skipIf(!url)("reserva pública", () => {
  it("anota un hueco libre como individual", async () => {
    const db = await openDb(url);
    await ready(db);
    const monday = addDays(mondayOf(new Date()), 7);
    const session = (await weekGrid(db, DG_ACADEMY_ID, monday)).find((s) => s.source === "availability" && s.location_id === "loc-costanera");
    expect(session).toBeTruthy();
    const phone = `+595981${Date.now().toString().slice(-6)}`;
    const { status } = await publicBook(db, DG_ACADEMY_ID, session!.id, "Ana Test", phone, {
      offeringId: "off-individual",
      category: "3",
      side: "drive",
    });
    expect(status).toBe("pending_payment");
    await db.end();
  });
});

describe.skipIf(!url)("paquete de 10", () => {
  it("al confirmar la reserva consume 1 clase y deja el aviso", async () => {
    const db = await openDb(url);
    await ready(db);
    const monday = addDays(mondayOf(new Date()), 7);
    const session = (await weekGrid(db, DG_ACADEMY_ID, monday)).find((s) => s.source === "availability");
    const phone = `+595982${Date.now().toString().slice(-6)}`;
    const booked = await publicBook(db, DG_ACADEMY_ID, session!.id, "Pack Test", phone, { offeringId: "off-grupal" });
    const [student] = await db`SELECT id FROM students WHERE phone = ${phone} AND academy_id = ${DG_ACADEMY_ID}`;
    await buyPack(db, String(student.id), "group", 10);
    const [booking] = await db`SELECT id FROM bookings WHERE session_id = ${booked.sessionId} AND student_id = ${student.id}`;
    const alert = await setBookingStatus(db, DG_ACADEMY_ID, String(booking.id), "confirmed");
    expect(alert?.remaining).toBe(9);
    const pack = await activePack(db, String(student.id), "group");
    expect(pack?.remaining).toBe(9);
    const alerts = await studentAlerts(db, String(student.id));
    expect(alerts.at(-1)?.message).toContain("Te quedan 9");
    await db.end();
  });
});

describe.skipIf(!url)("cutoff por academia", () => {
  it("persiste las horas de plazo", async () => {
    const db = await openDb(url);
    await ready(db);
    expect((await academyById(db, DG_ACADEMY_ID)).cutoff_hours).toBeGreaterThan(0);
    await updateCutoffHours(db, DG_ACADEMY_ID, 24);
    expect((await academyById(db, DG_ACADEMY_ID)).cutoff_hours).toBe(24);
    await updateCutoffHours(db, DG_ACADEMY_ID, 12);
    expect((await academyById(db, DG_ACADEMY_ID)).cutoff_hours).toBe(12);
    await db.end();
  });
});

describe.skipIf(!url)("catalogo DG", () => {
  it("Lomas tiene los 9 profes de la madre y Diego no se reserva", async () => {
    const db = await openDb(url);
    await ready(db);
    const cat = await catalogs(db, DG_ACADEMY_ID);
    expect(cat.coaches.some((c) => /diego/i.test(c.name))).toBe(false);
    const lomas = cat.coaches.filter((c) => c.location_ids.includes("loc-costanera")).map((c) => c.id).sort();
    expect(lomas).toEqual([
      "coach-fernando-laval",
      "coach-jose-mongelos",
      "coach-mathias-fernandez",
      "coach-matias-popovich",
      "coach-pablo-recalde",
      "coach-rodolfo-silva",
      "coach-rodrigo-avila",
      "coach-tati-enciso",
      "coach-viani-alfonzo",
    ]);
    const elite = cat.coaches.filter((c) => c.location_ids.includes("loc-parque")).map((c) => c.id).sort();
    expect(elite).toEqual(["coach-rodolfo-silva", "coach-sergio-gonzalez"]);
    const academies = await listAcademies(db);
    expect(academies.map((a) => a.slug).sort()).toEqual(expect.arrayContaining(["academiadg", "wpacademia"]));
    expect(academies.find((a) => a.id === DG_ACADEMY_ID)?.name).toBe("Academia DG");
    expect(academies.some((a) => /alameda/i.test(a.name))).toBe(false);
    const me = await handleApi(new Request("http://localhost/api/a/academiadg/me"), db);
    expect(me?.status).toBe(200);
    expect(await me!.json()).toEqual({ student: null, bookings: [] });
    await db.end();
  });
});

describe.skipIf(!url)("aislamiento", () => {
  it("el mismo teléfono es dos fichas y la grilla no se mezcla", async () => {
    const db = await openDb(url);
    await ready(db);
    const monday = addDays(mondayOf(new Date()), 7);
    await ensureWeek(db, WP_ACADEMY_ID, monday);
    const phone = `+595983${Date.now().toString().slice(-6)}`;
    const a = await findOrCreateStudent(db, DG_ACADEMY_ID, "Ana", phone);
    const b = await findOrCreateStudent(db, WP_ACADEMY_ID, "Ana WP", phone);
    expect(a.id).not.toBe(b.id);
    const dg = await weekSessions(db, DG_ACADEMY_ID, monday);
    const wp = await weekSessions(db, WP_ACADEMY_ID, monday);
    expect(wp.every((s) => s.id.startsWith("occ-tpl-wp"))).toBe(true);
    expect(dg.some((s) => s.id.startsWith("occ-tpl-wp"))).toBe(false);
    const coaches = await db`SELECT name, bio, languages FROM coaches WHERE academy_id = ${DG_ACADEMY_ID} ORDER BY name`;
    expect((coaches as { name: string }[]).map((c) => c.name)).toContain("Fernando Laval");
    expect((coaches as { name: string }[]).map((c) => c.name)).not.toContain("Diego");
    const tati = (coaches as { name: string; bio: string | null; languages: string[] }[]).find((c) => c.name === "Tati Enciso");
    expect(tati?.languages).toEqual(["es", "gn"]);
    expect(tati?.bio).toMatch(/guaraní/i);
    await db.end();
  });

  it("guest queda bloqueado si la ficha está ligada; staff no", async () => {
    const db = await openDb(url);
    await ready(db);
    const monday = addDays(mondayOf(new Date()), 7);
    const session = (await weekGrid(db, DG_ACADEMY_ID, monday)).find((s) => s.source === "availability");
    const phone = `+595984${Date.now().toString().slice(-6)}`;
    const student = await findOrCreateStudent(db, DG_ACADEMY_ID, "Clara", phone, {
      clerkUserId: `user_claimed_${Date.now()}`,
    });
    await expect(publicBook(db, DG_ACADEMY_ID, session!.id, "Clara", phone, { offeringId: "off-grupal" })).rejects.toBeInstanceOf(
      ClaimedFichaError,
    );
    const created = await publicBook(db, DG_ACADEMY_ID, session!.id, "Otro", `+595986${Date.now().toString().slice(-6)}`, {
      offeringId: "off-grupal",
    });
    const status = await bookStudent(db, DG_ACADEMY_ID, created.sessionId, student.id, "admin");
    expect(status).toBe("pending_payment");
    await db.end();
  });

  it("Clerk no hereda la cookie de otro jugador", async () => {
    const db = await openDb(url);
    await seedIfEmpty(db);
    const guest = await findOrCreateStudent(db, DG_ACADEMY_ID, "Alejandro", `+595981${Date.now().toString().slice(-6)}`);
    expect(await identifyPlayer(db, DG_ACADEMY_ID, { clerkUserId: "user_admin", cookieStudentId: guest.id })).toBeNull();
    expect((await identifyPlayer(db, DG_ACADEMY_ID, { cookieStudentId: guest.id }))?.id).toBe(guest.id);
    const clerkId = `user_player_iso_${Date.now()}`;
    const player = await findOrCreateStudent(db, DG_ACADEMY_ID, "Ana", `+595985${Date.now().toString().slice(-6)}`, {
      clerkUserId: clerkId,
    });
    expect((await identifyPlayer(db, DG_ACADEMY_ID, { clerkUserId: clerkId, cookieStudentId: guest.id }))?.id).toBe(
      player.id,
    );
    await db.end();
  });

  it("jugador Clerk reclama la ficha guest de esta misma cookie", async () => {
    const db = await openDb(url);
    await seedIfEmpty(db);
    const guest = await findOrCreateStudent(db, DG_ACADEMY_ID, "Ana Cookie", `+595982${Date.now().toString().slice(-6)}`);
    const clerkId = `user_claim_${Date.now()}`;
    const claimed = await identifyPlayer(db, DG_ACADEMY_ID, {
      clerkUserId: clerkId,
      cookieStudentId: guest.id,
      claimCookie: true,
    });
    expect(claimed?.id).toBe(guest.id);
    expect(claimed?.clerk_user_id).toBe(clerkId);
    expect((await identifyPlayer(db, DG_ACADEMY_ID, { clerkUserId: clerkId }))?.id).toBe(guest.id);
    await db.end();
  });

  it("publicBook con Clerk reclama la cookie guest aunque el teléfono sea otro", async () => {
    const db = await openDb(url);
    await ready(db);
    const monday = addDays(mondayOf(new Date()), 7);
    const holes = (await weekGrid(db, DG_ACADEMY_ID, monday)).filter((s) => s.source === "availability");
    const a = holes[0];
    const b = holes.find((s) => s.id !== a?.id);
    expect(a && b).toBeTruthy();
    const guestPhone = `+595987${Date.now().toString().slice(-6)}`;
    const guest = await publicBook(db, DG_ACADEMY_ID, a!.id, "Ana Guest", guestPhone, { offeringId: "off-grupal" });
    const clerkId = `user_book_claim_${Date.now()}`;
    const signed = await publicBook(db, DG_ACADEMY_ID, b!.id, "Ana Clerk", `+595988${Date.now().toString().slice(-6)}`, {
      offeringId: "off-grupal",
      clerkUserId: clerkId,
      cookieStudentId: guest.student.id,
    });
    expect(signed.student.id).toBe(guest.student.id);
    expect(signed.student.clerk_user_id).toBe(clerkId);
    expect((await identifyPlayer(db, DG_ACADEMY_ID, { clerkUserId: clerkId }))?.id).toBe(guest.student.id);
    await db.end();
  });
});
