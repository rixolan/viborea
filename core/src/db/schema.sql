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

CREATE INDEX idx_sessions_academy_starts ON sessions (academy_id, starts_at);
CREATE INDEX idx_sessions_court_time ON sessions (court_id, starts_at, ends_at);
CREATE INDEX idx_sessions_coach_time ON sessions (coach_id, starts_at, ends_at);
CREATE INDEX idx_bookings_session ON bookings (session_id);
CREATE INDEX idx_packs_student ON packs (student_id);
CREATE INDEX idx_locations_academy ON locations (academy_id);
CREATE INDEX idx_students_academy ON students (academy_id);
