import { addDays, bookStudent, buyPack, ensureWeek, mondayOf, openDb, setBookingStatus } from "../src/db";
import { DG_ACADEMY_ID, seedIfEmpty, alignCatalog } from "../src/seed";
import { parseCategory, parseSide, STUDENT_CATEGORIES, type StudentCategory } from "../src/domain/student";

const EXTRA_COACHES: [string, string][] = [
  ["teacher-andres", "Andrés Peña"],
  ["teacher-julia", "Julia Ferreira"],
  ["teacher-maxi", "Maxi Duarte"],
  ["teacher-lara", "Lara Benítez"],
  ["teacher-nico", "Nico Acosta"],
  ["teacher-ina", "Ina Rojas"],
];

const EXTRA_TEMPLATES: [string, string, string, string, string, string, string][] = [
  ["tpl-fill-mon-08-c1", "monday", "08:00", "off-individual", "loc-costanera", "teacher-andres", "court-costanera-1"],
  ["tpl-fill-mon-08-c2", "monday", "08:00", "off-dual", "loc-costanera", "teacher-julia", "court-costanera-2"],
  ["tpl-fill-tue-08-c3", "tuesday", "08:00", "off-individual", "loc-costanera", "teacher-maxi", "court-costanera-3"],
  ["tpl-fill-wed-18-c5", "wednesday", "18:00", "off-grupal", "loc-costanera", "teacher-lara", "court-costanera-5"],
  ["tpl-fill-thu-18-p2", "thursday", "18:00", "off-dual", "loc-parque", "teacher-nico", "court-parque-2"],
  ["tpl-fill-fri-09-r2", "friday", "09:00", "off-individual", "loc-ribera", "teacher-ina", "court-ribera-2"],
];

const FIRST = [
  "Ana", "Luis", "Marta", "Hugo", "Cora", "Iván", "Nuria", "Omar", "Pía", "Raúl",
  "Sara", "Tito", "Vera", "Waly", "Yaz", "Bruno", "Dina", "Eloy", "Fabi", "Galo",
];
const LAST = [
  "Giménez", "Pereira", "Cáceres", "Villalba", "Ortiz", "Báez", "Franco", "Rivas", "Núñez", "Sosa",
];

function endTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const db = await openDb();
await seedIfEmpty(db);
await alignCatalog(db);

for (const [id, name] of EXTRA_COACHES) {
  await db`INSERT INTO coaches (id, academy_id, name) VALUES (${id}, ${DG_ACADEMY_ID}, ${name}) ON CONFLICT (id) DO UPDATE SET name = ${name}`;
}

for (const [id, day, time, offering, loc, coach, court] of EXTRA_TEMPLATES) {
  await db`
    INSERT INTO templates (id, academy_id, offering_id, location_id, court_id, coach_id, weekday, start_time, end_time)
    VALUES (${id}, ${DG_ACADEMY_ID}, ${offering}, ${loc}, ${court}, ${coach}, ${day}, ${time}, ${endTime(time)})
    ON CONFLICT (id) DO NOTHING
  `;
}

const origin = mondayOf(new Date());
for (let w = -10; w <= 3; w++) {
  await ensureWeek(db, DG_ACADEMY_ID, addDays(origin, w * 7));
}

const studentIds: string[] = [];
for (let i = 0; i < 60; i++) {
  const id = `fill-student-${String(i + 1).padStart(2, "0")}`;
  const name = `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]}`;
  const phone = `+5959710${String(1000 + i).slice(-4)}`;
  const category = parseCategory(STUDENT_CATEGORIES[i % STUDENT_CATEGORIES.length]) as StudentCategory;
  const side = parseSide(i % 3 === 0 ? "drive" : i % 3 === 1 ? "reves" : "");
  await db`
    INSERT INTO students (id, academy_id, name, phone, category, side)
    VALUES (${id}, ${DG_ACADEMY_ID}, ${name}, ${phone}, ${category}, ${side})
    ON CONFLICT (id) DO UPDATE SET name = ${name}, category = ${category}, side = ${side}
  `;
  studentIds.push(id);
}

for (let i = 0; i < 24; i++) {
  const [existing] = await db`SELECT id FROM packs WHERE student_id = ${studentIds[i]} AND offering_kind = 'group' LIMIT 1`;
  if (!existing) await buyPack(db, studentIds[i], i % 2 === 0 ? "group" : "individual", 10);
}

const sessions = await db`
  SELECT id, capacity, starts_at, cancelled FROM sessions WHERE cancelled = false ORDER BY starts_at
`;

let booked = 0;
let si = 0;
for (const session of sessions) {
  const cap = Number(session.capacity);
  const fill = Math.max(1, Math.min(cap, 1 + (si % cap)));
  for (let n = 0; n < fill; n++) {
    const studentId = studentIds[(si + n * 7) % studentIds.length];
    try {
      const status = await bookStudent(db, DG_ACADEMY_ID, String(session.id), studentId, "admin");
      const [row] = await db`SELECT id FROM bookings WHERE session_id = ${session.id} AND student_id = ${studentId}`;
      if (row && new Date(session.starts_at as Date) < new Date() && status === "pending_payment") {
        await setBookingStatus(db, DG_ACADEMY_ID, String(row.id), "confirmed");
      } else if (row && (si + n) % 11 === 0) {
        await db`UPDATE bookings SET status = 'cancelled' WHERE id = ${row.id}`;
      }
      booked += 1;
    } catch {
      // full, duplicate, or overlap — skip
    }
  }
  si += 1;
}

const counts = await db`
  SELECT
    (SELECT COUNT(*)::int FROM coaches) AS coaches,
    (SELECT COUNT(*)::int FROM students) AS students,
    (SELECT COUNT(*)::int FROM sessions) AS sessions,
    (SELECT COUNT(*)::int FROM bookings) AS bookings,
    (SELECT COUNT(*)::int FROM bookings WHERE status = 'confirmed') AS confirmed,
    (SELECT COUNT(*)::int FROM packs) AS packs
`;
console.log(counts[0]);
await db.end();
