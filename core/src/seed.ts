import type { DayOfWeek } from "./domain/types";
import type { Db } from "./db";

export const DG_ACADEMY_ID = "academy-alameda";
export const WP_ACADEMY_ID = "academy-wp";

const L = "loc-costanera";
const E = "loc-parque";
const R = "loc-ribera";

export const DG_COACHES: [string, string][] = [
  ["coach-fernando-laval", "Fernando Laval"],
  ["coach-pablo-recalde", "Pablo Recalde"],
  ["coach-rodolfo-silva", "Rodolfo Silva"],
  ["coach-sergio-gonzalez", "Sergio González"],
  ["coach-viani-alfonzo", "Viani Alfonzo"],
  ["coach-jose-mongelos", "Jose Mongelos"],
  ["coach-tati-enciso", "Tati Enciso"],
  ["coach-matias-popovich", "Matias Popovich"],
  ["coach-rodrigo-avila", "Rodrigo Avila"],
  ["coach-mathias-fernandez", "Mathias Fernandez"],
];

/** Contiguous presence blocks from PROFESHORARIOSSEDESMADRE 2026-09-09. */
const BLOCKS: [string, DayOfWeek, string, string, string][] = [
  ["coach-fernando-laval", "monday", L, "06:00", "11:00"],
  ["coach-fernando-laval", "monday", R, "13:00", "17:00"],
  ["coach-fernando-laval", "tuesday", L, "06:00", "07:00"],
  ["coach-fernando-laval", "tuesday", L, "09:00", "11:00"],
  ["coach-fernando-laval", "tuesday", R, "13:00", "17:00"],
  ["coach-fernando-laval", "wednesday", L, "06:00", "11:00"],
  ["coach-fernando-laval", "wednesday", R, "12:00", "17:00"],
  ["coach-fernando-laval", "thursday", L, "06:00", "11:00"],
  ["coach-fernando-laval", "thursday", R, "13:00", "17:00"],
  ["coach-fernando-laval", "friday", L, "07:00", "11:00"],
  ["coach-fernando-laval", "friday", R, "12:00", "17:00"],
  ["coach-fernando-laval", "saturday", R, "08:00", "12:00"],

  ["coach-pablo-recalde", "monday", L, "06:00", "08:00"],
  ["coach-pablo-recalde", "monday", R, "13:00", "14:00"],
  ["coach-pablo-recalde", "monday", R, "15:00", "17:00"],
  ["coach-pablo-recalde", "tuesday", L, "06:00", "11:00"],
  ["coach-pablo-recalde", "tuesday", R, "14:00", "15:00"],
  ["coach-pablo-recalde", "tuesday", R, "16:00", "17:00"],
  ["coach-pablo-recalde", "wednesday", L, "06:00", "07:00"],
  ["coach-pablo-recalde", "wednesday", L, "08:00", "09:00"],
  ["coach-pablo-recalde", "wednesday", L, "10:00", "11:00"],
  ["coach-pablo-recalde", "wednesday", R, "13:00", "17:00"],
  ["coach-pablo-recalde", "thursday", L, "06:00", "07:00"],
  ["coach-pablo-recalde", "thursday", L, "08:00", "11:00"],
  ["coach-pablo-recalde", "thursday", R, "14:00", "17:00"],
  ["coach-pablo-recalde", "friday", L, "06:00", "09:00"],
  ["coach-pablo-recalde", "friday", R, "13:00", "17:00"],
  ["coach-pablo-recalde", "saturday", L, "07:00", "09:00"],
  ["coach-pablo-recalde", "saturday", L, "11:00", "12:00"],

  ["coach-rodolfo-silva", "monday", E, "07:00", "08:00"],
  ["coach-rodolfo-silva", "monday", E, "13:00", "14:00"],
  ["coach-rodolfo-silva", "monday", E, "15:00", "17:00"],
  ["coach-rodolfo-silva", "monday", L, "12:00", "17:00"],
  ["coach-rodolfo-silva", "tuesday", E, "06:00", "07:00"],
  ["coach-rodolfo-silva", "tuesday", E, "08:00", "09:00"],
  ["coach-rodolfo-silva", "tuesday", E, "11:00", "12:00"],
  ["coach-rodolfo-silva", "tuesday", E, "14:00", "15:00"],
  ["coach-rodolfo-silva", "tuesday", E, "16:00", "17:00"],
  ["coach-rodolfo-silva", "tuesday", L, "15:00", "17:00"],
  ["coach-rodolfo-silva", "wednesday", E, "08:00", "09:00"],
  ["coach-rodolfo-silva", "wednesday", E, "11:00", "13:00"],
  ["coach-rodolfo-silva", "wednesday", E, "15:00", "17:00"],
  ["coach-rodolfo-silva", "wednesday", L, "16:00", "17:00"],
  ["coach-rodolfo-silva", "thursday", E, "06:00", "09:00"],
  ["coach-rodolfo-silva", "thursday", E, "11:00", "17:00"],
  ["coach-rodolfo-silva", "friday", E, "09:00", "10:00"],
  ["coach-rodolfo-silva", "friday", E, "11:00", "17:00"],
  ["coach-rodolfo-silva", "saturday", R, "08:00", "13:00"],

  ["coach-sergio-gonzalez", "monday", E, "12:00", "13:00"],
  ["coach-sergio-gonzalez", "monday", E, "14:00", "15:00"],
  ["coach-sergio-gonzalez", "monday", E, "17:00", "18:00"],
  ["coach-sergio-gonzalez", "tuesday", E, "08:00", "10:00"],
  ["coach-sergio-gonzalez", "tuesday", E, "14:00", "17:00"],
  ["coach-sergio-gonzalez", "wednesday", E, "08:00", "09:00"],
  ["coach-sergio-gonzalez", "wednesday", E, "11:00", "12:00"],
  ["coach-sergio-gonzalez", "wednesday", E, "14:00", "17:00"],
  ["coach-sergio-gonzalez", "thursday", E, "08:00", "12:00"],
  ["coach-sergio-gonzalez", "thursday", E, "14:00", "17:00"],
  ["coach-sergio-gonzalez", "friday", E, "11:00", "12:00"],
  ["coach-sergio-gonzalez", "friday", E, "15:00", "17:00"],

  ["coach-viani-alfonzo", "monday", L, "06:00", "08:00"],
  ["coach-viani-alfonzo", "monday", L, "11:00", "17:00"],
  ["coach-viani-alfonzo", "tuesday", L, "06:00", "10:00"],
  ["coach-viani-alfonzo", "tuesday", L, "12:00", "17:00"],
  ["coach-viani-alfonzo", "wednesday", L, "06:00", "11:00"],
  ["coach-viani-alfonzo", "wednesday", L, "13:00", "17:00"],
  ["coach-viani-alfonzo", "thursday", L, "06:00", "17:00"],
  ["coach-viani-alfonzo", "friday", L, "07:00", "10:00"],
  ["coach-viani-alfonzo", "friday", L, "12:00", "17:00"],
  ["coach-viani-alfonzo", "saturday", L, "07:00", "11:00"],

  ["coach-jose-mongelos", "monday", L, "06:00", "07:00"],
  ["coach-jose-mongelos", "monday", L, "08:00", "17:00"],
  ["coach-jose-mongelos", "tuesday", L, "06:00", "17:00"],
  ["coach-jose-mongelos", "wednesday", L, "06:00", "07:00"],
  ["coach-jose-mongelos", "wednesday", L, "08:00", "09:00"],
  ["coach-jose-mongelos", "wednesday", L, "10:00", "11:00"],
  ["coach-jose-mongelos", "wednesday", L, "12:00", "13:00"],
  ["coach-jose-mongelos", "wednesday", L, "14:00", "17:00"],
  ["coach-jose-mongelos", "thursday", L, "06:00", "17:00"],
  ["coach-jose-mongelos", "friday", L, "06:00", "09:00"],
  ["coach-jose-mongelos", "friday", L, "12:00", "17:00"],

  ["coach-tati-enciso", "monday", L, "11:00", "12:00"],
  ["coach-tati-enciso", "monday", L, "13:00", "17:00"],
  ["coach-tati-enciso", "tuesday", L, "10:00", "17:00"],
  ["coach-tati-enciso", "thursday", L, "10:00", "14:00"],
  ["coach-tati-enciso", "thursday", L, "16:00", "17:00"],
  ["coach-tati-enciso", "friday", L, "11:00", "15:00"],
  ["coach-tati-enciso", "friday", L, "17:00", "18:00"],
  ["coach-tati-enciso", "saturday", L, "08:00", "16:00"],

  ["coach-matias-popovich", "monday", L, "06:00", "14:00"],
  ["coach-matias-popovich", "tuesday", L, "08:00", "11:00"],
  ["coach-matias-popovich", "tuesday", L, "13:00", "14:00"],
  ["coach-matias-popovich", "wednesday", L, "06:00", "14:00"],
  ["coach-matias-popovich", "thursday", L, "06:00", "07:00"],
  ["coach-matias-popovich", "thursday", L, "08:00", "11:00"],
  ["coach-matias-popovich", "thursday", L, "13:00", "14:00"],
  ["coach-matias-popovich", "friday", L, "07:00", "10:00"],
  ["coach-matias-popovich", "friday", L, "12:00", "15:00"],

  ["coach-rodrigo-avila", "monday", L, "12:00", "13:00"],
  ["coach-rodrigo-avila", "monday", L, "14:00", "17:00"],
  ["coach-rodrigo-avila", "tuesday", L, "12:00", "14:00"],
  ["coach-rodrigo-avila", "tuesday", L, "16:00", "17:00"],
  ["coach-rodrigo-avila", "wednesday", L, "14:00", "17:00"],
  ["coach-rodrigo-avila", "thursday", L, "12:00", "17:00"],
  ["coach-rodrigo-avila", "friday", L, "12:00", "13:00"],
  ["coach-rodrigo-avila", "friday", L, "14:00", "15:00"],
  ["coach-rodrigo-avila", "friday", L, "16:00", "17:00"],

  ["coach-mathias-fernandez", "tuesday", L, "11:00", "17:00"],
  ["coach-mathias-fernandez", "thursday", L, "11:00", "17:00"],
  ["coach-mathias-fernandez", "friday", L, "08:00", "09:00"],
  ["coach-mathias-fernandez", "friday", L, "12:00", "13:00"],
  ["coach-mathias-fernandez", "friday", L, "14:00", "15:00"],
  ["coach-mathias-fernandez", "friday", L, "16:00", "17:00"],
  ["coach-mathias-fernandez", "saturday", L, "07:00", "11:00"],
  ["coach-mathias-fernandez", "saturday", L, "13:00", "14:00"],
];

export async function seedIfEmpty(db: Db): Promise<void> {
  const [row] = await db`SELECT id FROM academy LIMIT 1`;
  if (row) return;

  await db.begin(async (tx) => {
    await tx`INSERT INTO academy (id, slug, name, locale, currency, timezone) VALUES
      (${DG_ACADEMY_ID}, 'academiadg', 'Academia DG', 'es-PY', 'PYG', 'America/Asuncion'),
      (${WP_ACADEMY_ID}, 'wpacademia', 'WP Academia', 'es-PY', 'PYG', 'America/Asuncion')`;
    await tx`INSERT INTO locations (id, academy_id, name, address, maps_url, image_url) VALUES
      ('loc-costanera', ${DG_ACADEMY_ID}, 'Lomas Padel', 'Av. Dr. Felipe Molas López Esquina, Asunción', 'https://www.google.com/maps/search/?api=1&query=Lomas+Padel+Av.+Dr.+Felipe+Molas+López+Asunción', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&h=500&q=80'),
      ('loc-parque', ${DG_ACADEMY_ID}, 'Elite Padel Bar', 'Av. Primer Presidente, Asunción', 'https://maps.app.goo.gl/p2oQg1pMPGXXMmi8A', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&h=500&q=80'),
      ('loc-ribera', ${DG_ACADEMY_ID}, 'Segurola y Habana Padel Center', 'Capitán Elías Ayala, Asunción', 'https://www.google.com/maps/search/?api=1&query=Segurola+y+Habana+Padel+Center+Capitan+Elias+Ayala+Asunción', 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&h=500&q=80'),
      ('loc-wp-1', ${WP_ACADEMY_ID}, 'WP Sede', null, null, null)`;

    const courts: [string, string, string, string, number][] = [];
    for (let n = 1; n <= 6; n++) courts.push([`court-costanera-${n}`, DG_ACADEMY_ID, L, `Cancha ${n}`, n]);
    courts.push(["court-parque-1", DG_ACADEMY_ID, E, "Cancha 1", 1], ["court-parque-2", DG_ACADEMY_ID, E, "Cancha 2", 2]);
    courts.push(["court-ribera-1", DG_ACADEMY_ID, R, "Cancha 1", 1], ["court-ribera-2", DG_ACADEMY_ID, R, "Cancha 2", 2]);
    courts.push(["court-wp-1", WP_ACADEMY_ID, "loc-wp-1", "Cancha 1", 1]);
    for (const [id, academyId, locationId, name, number] of courts) {
      await tx`INSERT INTO courts (id, academy_id, location_id, name, number) VALUES (${id}, ${academyId}, ${locationId}, ${name}, ${number})`;
    }

    for (const [id, name] of DG_COACHES) {
      await tx`INSERT INTO coaches (id, academy_id, name) VALUES (${id}, ${DG_ACADEMY_ID}, ${name})`;
    }
    await tx`INSERT INTO coaches (id, academy_id, name) VALUES ('coach-wp-1', ${WP_ACADEMY_ID}, 'Profe WP')`;

    await tx`INSERT INTO offerings (id, academy_id, name, duration_minutes, capacity, price) VALUES
      ('off-individual', ${DG_ACADEMY_ID}, 'Individual', 60, 1, 150000),
      ('off-grupal', ${DG_ACADEMY_ID}, 'Grupal', 60, 4, 100000),
      ('off-wp-grupal', ${WP_ACADEMY_ID}, 'Grupal', 60, 4, 100000)`;

    await tx`INSERT INTO templates (id, academy_id, offering_id, location_id, court_id, coach_id, weekday, start_time, end_time)
      VALUES ('tpl-wp-mon-18', ${WP_ACADEMY_ID}, 'off-wp-grupal', 'loc-wp-1', 'court-wp-1', 'coach-wp-1', 'monday', '18:00', '19:00')`;

    await insertAvailability(tx);

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
      const phone = `+59598100000${i + 1}`;
      await tx`INSERT INTO students (id, academy_id, name, phone, category, side)
        VALUES (${`student-${i + 1}`}, ${DG_ACADEMY_ID}, ${names[i]}, ${phone}, 'beginner', null)`;
    }
  });
}

async function insertAvailability(tx: Db): Promise<void> {
  for (const [coachId, weekday, locationId, start, end] of BLOCKS) {
    const id = `av-${coachId}-${weekday}-${locationId}-${start.replace(":", "")}`;
    await tx`INSERT INTO coach_availability (id, academy_id, coach_id, location_id, weekday, start_time, end_time)
      VALUES (${id}, ${DG_ACADEMY_ID}, ${coachId}, ${locationId}, ${weekday}, ${start}, ${end})
      ON CONFLICT (id) DO UPDATE SET start_time = ${start}, end_time = ${end}`;
  }
}

export async function replaceDgRoster(db: Db): Promise<void> {
  const ids = DG_COACHES.map(([id]) => id);
  await db.begin(async (tx) => {
    await tx`DELETE FROM bookings WHERE session_id IN (
      SELECT id FROM sessions WHERE academy_id = ${DG_ACADEMY_ID} AND NOT (coach_id = ANY(${ids}))
    )`;
    await tx`DELETE FROM sessions WHERE academy_id = ${DG_ACADEMY_ID} AND NOT (coach_id = ANY(${ids}))`;
    await tx`DELETE FROM templates WHERE academy_id = ${DG_ACADEMY_ID}`;
    await tx`DELETE FROM coach_availability WHERE academy_id = ${DG_ACADEMY_ID}`;
    await tx`DELETE FROM coaches WHERE academy_id = ${DG_ACADEMY_ID} AND NOT (id = ANY(${ids}))`;
    await tx`DELETE FROM offerings WHERE id = 'off-dual'`;
    for (const [id, name] of DG_COACHES) {
      await tx`INSERT INTO coaches (id, academy_id, name) VALUES (${id}, ${DG_ACADEMY_ID}, ${name})
        ON CONFLICT (id) DO UPDATE SET name = ${name}`;
    }
    await insertAvailability(tx);
  });
}

export async function alignCatalog(db: Db): Promise<void> {
  await db`UPDATE locations SET
    name = 'Lomas Padel',
    address = 'Av. Dr. Felipe Molas López Esquina, Asunción',
    maps_url = 'https://www.google.com/maps/search/?api=1&query=Lomas+Padel+Av.+Dr.+Felipe+Molas+López+Asunción',
    image_url = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&h=500&q=80'
    WHERE id = 'loc-costanera'`;
  await db`UPDATE locations SET
    name = 'Elite Padel Bar',
    address = 'Av. Primer Presidente, Asunción',
    maps_url = 'https://maps.app.goo.gl/p2oQg1pMPGXXMmi8A',
    image_url = 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&h=500&q=80'
    WHERE id = 'loc-parque'`;
  await db`UPDATE locations SET
    name = 'Segurola y Habana Padel Center',
    address = 'Capitán Elías Ayala, Asunción',
    maps_url = 'https://www.google.com/maps/search/?api=1&query=Segurola+y+Habana+Padel+Center+Capitan+Elias+Ayala+Asunción',
    image_url = 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&h=500&q=80'
    WHERE id = 'loc-ribera'`;
  await replaceDgRoster(db);
}
