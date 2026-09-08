import type { DayOfWeek } from "./domain/types";
import type { Db } from "./db";

const TEMPLATES: [string, DayOfWeek, string, string, string, string, string][] = [
  ["tpl-mon-15-c1", "monday", "15:00", "off-individual", "loc-costanera", "teacher-lucia", "court-costanera-1"],
  ["tpl-mon-15-c2", "monday", "15:00", "off-dual", "loc-costanera", "teacher-marcos", "court-costanera-2"],
  ["tpl-mon-15-c3", "monday", "15:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-3"],
  ["tpl-mon-16-c1", "monday", "16:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-1"],
  ["tpl-mon-16-c2", "monday", "16:00", "off-individual", "loc-costanera", "teacher-marcos", "court-costanera-2"],
  ["tpl-mon-17-c4", "monday", "17:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-4"],
  ["tpl-mon-08-c6", "monday", "08:00", "off-individual", "loc-costanera", "teacher-sofia", "court-costanera-6"],
  ["tpl-mon-09-p1", "monday", "09:00", "off-dual", "loc-parque", "teacher-lucia", "court-parque-1"],
  ["tpl-tue-15-c1", "tuesday", "15:00", "off-individual", "loc-costanera", "teacher-marcos", "court-costanera-1"],
  ["tpl-tue-15-c2", "tuesday", "15:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-2"],
  ["tpl-tue-16-c3", "tuesday", "16:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-3"],
  ["tpl-wed-15-c1", "wednesday", "15:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-1"],
  ["tpl-wed-15-c2", "wednesday", "15:00", "off-individual", "loc-costanera", "teacher-lucia", "court-costanera-2"],
  ["tpl-thu-15-c1", "thursday", "15:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-1"],
  ["tpl-thu-16-c3", "thursday", "16:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-3"],
  ["tpl-fri-15-c2", "friday", "15:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-2"],
  ["tpl-fri-16-c4", "friday", "16:00", "off-grupal", "loc-costanera", "teacher-marcos", "court-costanera-4"],
  ["tpl-sat-09-c1", "saturday", "09:00", "off-grupal", "loc-costanera", "teacher-marcos", "court-costanera-1"],
  ["tpl-sat-10-c2", "saturday", "10:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-2"],
  ["tpl-sun-10-c1", "sunday", "10:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-1"],
  ["tpl-wed-16-r1", "wednesday", "16:00", "off-dual", "loc-ribera", "teacher-pablo", "court-ribera-1"],
];

export async function seedIfEmpty(db: Db): Promise<void> {
  const [row] = await db`SELECT id FROM academy LIMIT 1`;
  if (row) return;

  await db.begin(async (tx) => {
    await tx`INSERT INTO academy (id, name, locale, currency, timezone) VALUES ('academy-alameda', 'Academia Alameda', 'es-PY', 'PYG', 'America/Asuncion')`;
    await tx`INSERT INTO locations (id, name) VALUES ('loc-costanera', 'Lomas'), ('loc-parque', 'Elite Padel'), ('loc-ribera', 'Habana')`;

    const courts: [string, string, string, number][] = [];
    for (let n = 1; n <= 6; n++) courts.push([`court-costanera-${n}`, "loc-costanera", `Cancha ${n}`, n]);
    courts.push(["court-parque-1", "loc-parque", "Cancha 1", 1], ["court-parque-2", "loc-parque", "Cancha 2", 2]);
    courts.push(["court-ribera-1", "loc-ribera", "Cancha 1", 1], ["court-ribera-2", "loc-ribera", "Cancha 2", 2]);
    for (const [id, locationId, name, number] of courts) {
      await tx`INSERT INTO courts (id, location_id, name, number) VALUES (${id}, ${locationId}, ${name}, ${number})`;
    }

    await tx`INSERT INTO coaches (id, name) VALUES
      ('teacher-lucia', 'Rodrigo Avila'),
      ('teacher-marcos', 'Tati'),
      ('teacher-sofia', 'Diego'),
      ('teacher-pablo', 'Pablo')`;

    await tx`INSERT INTO offerings (id, name, duration_minutes, capacity, price) VALUES
      ('off-individual', 'Individual', 60, 1, 150000),
      ('off-dual', 'Dual', 60, 2, 125000),
      ('off-grupal', 'Grupal', 60, 4, 100000)`;

    for (const [id, day, time, offering, loc, coach, court] of TEMPLATES) {
      const [h, m] = time.split(":").map(Number);
      const end = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      await tx`INSERT INTO templates (id, offering_id, location_id, court_id, coach_id, weekday, start_time, end_time)
        VALUES (${id}, ${offering}, ${loc}, ${court}, ${coach}, ${day}, ${time}, ${end})`;
    }

    const names = [
      "María González",
      "Mateo Benítez",
      "Camila Vera",
      "Thiago Rojas",
      "Elena Cáceres",
      "Joaquín Duarte",
      "Valentina Ortiz",
      "Santiago López",
    ];
    for (let i = 0; i < names.length; i++) {
      const phone = `+59598000000${i + 1}`;
      await tx`INSERT INTO students (id, name, phone, category, side)
        VALUES (${`student-${i + 1}`}, ${names[i]}, ${phone}, 'beginner', null)`;
    }
  });
}

export async function alignCatalog(db: Db): Promise<void> {
  await db`UPDATE locations SET name = 'Lomas' WHERE id = 'loc-costanera'`;
  await db`UPDATE locations SET name = 'Elite Padel' WHERE id = 'loc-parque'`;
  await db`UPDATE locations SET name = 'Habana' WHERE id = 'loc-ribera'`;
  await db`UPDATE coaches SET name = 'Rodrigo Avila' WHERE id = 'teacher-lucia'`;
  await db`UPDATE coaches SET name = 'Tati' WHERE id = 'teacher-marcos'`;
  await db`UPDATE coaches SET name = 'Diego' WHERE id = 'teacher-sofia'`;
  await db`INSERT INTO coaches (id, name) VALUES ('teacher-pablo', 'Pablo') ON CONFLICT (id) DO UPDATE SET name = 'Pablo'`;
}
