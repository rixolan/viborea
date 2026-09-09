CREATE TABLE academy (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  locale TEXT NOT NULL,
  currency TEXT NOT NULL,
  timezone TEXT NOT NULL,
  cutoff_hours INTEGER NOT NULL DEFAULT 12,
  clerk_org_id TEXT UNIQUE
);

CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  academy_id TEXT NOT NULL REFERENCES academy(id),
  name TEXT NOT NULL,
  address TEXT,
  maps_url TEXT,
  image_url TEXT
);

CREATE TABLE courts (
  id TEXT PRIMARY KEY,
  academy_id TEXT NOT NULL REFERENCES academy(id),
  location_id TEXT NOT NULL REFERENCES locations(id),
  name TEXT NOT NULL,
  number INTEGER
);

CREATE TABLE coaches (
  id TEXT PRIMARY KEY,
  academy_id TEXT NOT NULL REFERENCES academy(id),
  name TEXT NOT NULL
);

CREATE TABLE offerings (
  id TEXT PRIMARY KEY,
  academy_id TEXT NOT NULL REFERENCES academy(id),
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  price INTEGER NOT NULL
);

CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  academy_id TEXT NOT NULL REFERENCES academy(id),
  offering_id TEXT NOT NULL REFERENCES offerings(id),
  location_id TEXT NOT NULL REFERENCES locations(id),
  court_id TEXT NOT NULL REFERENCES courts(id),
  coach_id TEXT NOT NULL REFERENCES coaches(id),
  weekday TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  academy_id TEXT NOT NULL REFERENCES academy(id),
  template_id TEXT REFERENCES templates(id),
  offering_id TEXT NOT NULL REFERENCES offerings(id),
  location_id TEXT NOT NULL REFERENCES locations(id),
  court_id TEXT NOT NULL REFERENCES courts(id),
  coach_id TEXT NOT NULL REFERENCES coaches(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL,
  source TEXT NOT NULL,
  cancelled BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE students (
  id TEXT PRIMARY KEY,
  academy_id TEXT NOT NULL REFERENCES academy(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  clerk_user_id TEXT,
  category TEXT NOT NULL DEFAULT 'beginner'
    CHECK (category IN ('beginner', '1', '2', '3', '4', '5', '6', '7', '8', 'pro')),
  side TEXT
    CHECK (side IS NULL OR side IN ('drive', 'reves')),
  UNIQUE (academy_id, phone)
);

CREATE UNIQUE INDEX students_academy_clerk ON students (academy_id, clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

CREATE TABLE packs (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  offering_kind TEXT NOT NULL,
  size INTEGER NOT NULL,
  remaining INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  status TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'admin',
  pack_id TEXT REFERENCES packs(id),
  UNIQUE (session_id, student_id)
);

CREATE TABLE pack_alerts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  pack_id TEXT NOT NULL REFERENCES packs(id),
  remaining INTEGER NOT NULL,
  total INTEGER NOT NULL,
  buy_again BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE coach_availability (
  id TEXT PRIMARY KEY,
  academy_id TEXT NOT NULL REFERENCES academy(id),
  coach_id TEXT NOT NULL REFERENCES coaches(id),
  location_id TEXT NOT NULL REFERENCES locations(id),
  weekday TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);

CREATE INDEX idx_sessions_academy_starts ON sessions (academy_id, starts_at);
CREATE INDEX idx_sessions_court_time ON sessions (court_id, starts_at, ends_at);
CREATE INDEX idx_sessions_coach_time ON sessions (coach_id, starts_at, ends_at);
CREATE INDEX idx_bookings_session ON bookings (session_id);
CREATE INDEX idx_packs_student ON packs (student_id);
CREATE INDEX idx_locations_academy ON locations (academy_id);
CREATE INDEX idx_students_academy ON students (academy_id);
CREATE INDEX idx_availability_academy ON coach_availability (academy_id, weekday);

CREATE VIEW slot_hours AS
SELECT
  a.academy_id,
  a.coach_id,
  a.location_id,
  a.weekday,
  (a.start_time::time + (g * INTERVAL '1 hour'))::time AS hour
FROM coach_availability a
CROSS JOIN LATERAL generate_series(
  0,
  GREATEST((EXTRACT(EPOCH FROM (a.end_time::time - a.start_time::time)) / 3600)::int - 1, -1)
) AS g;

CREATE VIEW metabase_disponibilidad_profe AS
SELECT
  ac.slug AS academia,
  ch.name AS profe,
  l.name AS sede,
  CASE sh.weekday
    WHEN 'monday' THEN 'Lunes'
    WHEN 'tuesday' THEN 'Martes'
    WHEN 'wednesday' THEN 'Miércoles'
    WHEN 'thursday' THEN 'Jueves'
    WHEN 'friday' THEN 'Viernes'
    WHEN 'saturday' THEN 'Sábado'
    ELSE 'Domingo'
  END AS dia,
  CASE sh.weekday
    WHEN 'monday' THEN 1
    WHEN 'tuesday' THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday' THEN 4
    WHEN 'friday' THEN 5
    WHEN 'saturday' THEN 6
    ELSE 7
  END AS dia_n,
  sh.hour AS hora,
  to_char(sh.hour, 'HH24:MI') AS hora_txt
FROM slot_hours sh
JOIN academy ac ON ac.id = sh.academy_id
JOIN coaches ch ON ch.id = sh.coach_id
JOIN locations l ON l.id = sh.location_id;

CREATE VIEW metabase_disponibilidad_calendario AS
SELECT
  ac.slug AS academia,
  ch.name AS profe,
  l.name AS sede,
  d.fecha::date AS fecha,
  CASE EXTRACT(ISODOW FROM d.fecha)::int
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
    ELSE 'Domingo'
  END AS dia,
  sh.hour AS hora,
  to_char(sh.hour, 'HH24:MI') AS hora_txt,
  ((d.fecha::timestamp + sh.hour) AT TIME ZONE 'UTC') AS empieza,
  ((d.fecha::timestamp + sh.hour + INTERVAL '1 hour') AT TIME ZONE 'UTC') AS termina,
  EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.coach_id = sh.coach_id
      AND s.cancelled = false
      AND s.starts_at = ((d.fecha::timestamp + sh.hour) AT TIME ZONE 'UTC')
  ) AS ocupado
FROM slot_hours sh
JOIN academy ac ON ac.id = sh.academy_id
JOIN coaches ch ON ch.id = sh.coach_id
JOIN locations l ON l.id = sh.location_id
CROSS JOIN LATERAL generate_series(
  date_trunc('week', timezone(ac.timezone, now()))::date,
  date_trunc('week', timezone(ac.timezone, now()))::date + 27,
  INTERVAL '1 day'
) AS d(fecha)
WHERE EXTRACT(ISODOW FROM d.fecha)::int =
  CASE sh.weekday
    WHEN 'monday' THEN 1
    WHEN 'tuesday' THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday' THEN 4
    WHEN 'friday' THEN 5
    WHEN 'saturday' THEN 6
    ELSE 7
  END;
