import type { Database } from "bun:sqlite";
import type { DayOfWeek } from "./domain/types";

export function seedIfEmpty(db: Database): void {
  const row = db.query("SELECT id FROM academy LIMIT 1").get();
  if (row) return;

  const run = db.transaction(() => {
    db.query("INSERT INTO academy (id, name, locale, currency, timezone) VALUES (?, ?, ?, ?, ?)").run(
      "academy-alameda",
      "Academia Alameda",
      "es-PY",
      "PYG",
      "America/Asuncion",
    );

    for (const loc of [
      ["loc-costanera", "Costanera"],
      ["loc-parque", "Parque"],
      ["loc-ribera", "Ribera"],
    ] as const) {
      db.query("INSERT INTO locations (id, name) VALUES (?, ?)").run(...loc);
    }

    const courts: [string, string, string, number][] = [];
    for (let n = 1; n <= 6; n++) courts.push([`court-costanera-${n}`, "loc-costanera", `Cancha ${n}`, n]);
    courts.push(["court-parque-1", "loc-parque", "Cancha 1", 1], ["court-parque-2", "loc-parque", "Cancha 2", 2]);
    courts.push(["court-ribera-1", "loc-ribera", "Cancha 1", 1], ["court-ribera-2", "loc-ribera", "Cancha 2", 2]);
    for (const c of courts) {
      db.query("INSERT INTO courts (id, location_id, name, number) VALUES (?, ?, ?, ?)").run(...c);
    }

    for (const ch of [
      ["teacher-lucia", "Lucía Benítez"],
      ["teacher-marcos", "Marcos Villalba"],
      ["teacher-sofia", "Sofía Rivas"],
    ] as const) {
      db.query("INSERT INTO coaches (id, name) VALUES (?, ?)").run(...ch);
    }

    db.query("INSERT INTO offerings (id, name, duration_minutes, capacity, price) VALUES (?, ?, ?, ?, ?)").run(
      "off-individual",
      "Individual",
      60,
      1,
      150_000,
    );
    db.query("INSERT INTO offerings (id, name, duration_minutes, capacity, price) VALUES (?, ?, ?, ?, ?)").run(
      "off-dual",
      "Dual",
      60,
      2,
      125_000,
    );
    db.query("INSERT INTO offerings (id, name, duration_minutes, capacity, price) VALUES (?, ?, ?, ?, ?)").run(
      "off-grupal",
      "Grupal",
      60,
      4,
      100_000,
    );

    const tpl = (
      id: string,
      day: DayOfWeek,
      time: string,
      offering: string,
      loc: string,
      coach: string,
      court: string,
    ) => {
      const [h, m] = time.split(":").map(Number);
      const end = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      db.query(
        "INSERT INTO templates (id, offering_id, location_id, court_id, coach_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(id, offering, loc, court, coach, day, time, end);
    };

    tpl("tpl-mon-15-c1", "monday", "15:00", "off-individual", "loc-costanera", "teacher-lucia", "court-costanera-1");
    tpl("tpl-mon-15-c2", "monday", "15:00", "off-dual", "loc-costanera", "teacher-marcos", "court-costanera-2");
    tpl("tpl-mon-15-c3", "monday", "15:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-3");
    tpl("tpl-mon-16-c1", "monday", "16:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-1");
    tpl("tpl-mon-16-c2", "monday", "16:00", "off-individual", "loc-costanera", "teacher-marcos", "court-costanera-2");
    tpl("tpl-mon-17-c4", "monday", "17:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-4");
    tpl("tpl-mon-08-c6", "monday", "08:00", "off-individual", "loc-costanera", "teacher-sofia", "court-costanera-6");
    tpl("tpl-mon-09-p1", "monday", "09:00", "off-dual", "loc-parque", "teacher-lucia", "court-parque-1");
    tpl("tpl-tue-15-c1", "tuesday", "15:00", "off-individual", "loc-costanera", "teacher-marcos", "court-costanera-1");
    tpl("tpl-tue-15-c2", "tuesday", "15:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-2");
    tpl("tpl-tue-16-c3", "tuesday", "16:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-3");
    tpl("tpl-wed-15-c1", "wednesday", "15:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-1");
    tpl("tpl-wed-15-c2", "wednesday", "15:00", "off-individual", "loc-costanera", "teacher-lucia", "court-costanera-2");
    tpl("tpl-thu-15-c1", "thursday", "15:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-1");
    tpl("tpl-thu-16-c3", "thursday", "16:00", "off-grupal", "loc-costanera", "teacher-sofia", "court-costanera-3");
    tpl("tpl-fri-15-c2", "friday", "15:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-2");
    tpl("tpl-fri-16-c4", "friday", "16:00", "off-grupal", "loc-costanera", "teacher-marcos", "court-costanera-4");
    tpl("tpl-sat-09-c1", "saturday", "09:00", "off-grupal", "loc-costanera", "teacher-marcos", "court-costanera-1");
    tpl("tpl-sat-10-c2", "saturday", "10:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-2");
    tpl("tpl-sun-10-c1", "sunday", "10:00", "off-dual", "loc-costanera", "teacher-lucia", "court-costanera-1");

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
    names.forEach((name, i) => {
      db.query("INSERT INTO students (id, name) VALUES (?, ?)").run(`student-${i + 1}`, name);
    });
  });
  run();
}
