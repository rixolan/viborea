-- Bandeja: Court as a scarce resource on Session.
--
-- class_occurrence grain is unchanged (one offering instance at one interval).
-- court_id is the same kind of resource FK as teacher_id.
-- room TEXT stays for legacy yoga rows; padel academies set court_id in the app.
--
-- btree_gist enables scalar equality in GiST exclusion constraints.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- COURTS
-- ============================================================================

CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number INTEGER,
  surface TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (location_id, name)
);

CREATE INDEX idx_courts_studio ON courts(studio_id);
CREATE INDEX idx_courts_location ON courts(location_id);

ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio participants can view courts"
  ON courts FOR SELECT
  USING (
    studio_id IN (
      SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Studio staff can manage courts"
  ON courts FOR ALL
  USING (
    studio_id IN (
      SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()
    )
  );

CREATE TRIGGER update_courts_updated_at
  BEFORE UPDATE ON courts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SESSION / TEMPLATE: court + source
-- ============================================================================

ALTER TABLE schedule_rules
  ADD COLUMN IF NOT EXISTS court_id UUID REFERENCES courts(id) ON DELETE RESTRICT;

ALTER TABLE class_occurrences
  ADD COLUMN IF NOT EXISTS court_id UUID REFERENCES courts(id) ON DELETE RESTRICT;

ALTER TABLE class_occurrences
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'template';

ALTER TABLE class_occurrences
  DROP CONSTRAINT IF EXISTS class_occurrences_source_check;

ALTER TABLE class_occurrences
  ADD CONSTRAINT class_occurrences_source_check
  CHECK (source IN ('template', 'exception', 'one_off'));

CREATE INDEX IF NOT EXISTS idx_class_occurrences_court ON class_occurrences(court_id);
CREATE INDEX IF NOT EXISTS idx_schedule_rules_court ON schedule_rules(court_id);

COMMENT ON COLUMN class_occurrences.court_id IS
  'Scarce court resource. Required at the application layer for padel academies; nullable for legacy/virtual rows.';
COMMENT ON COLUMN class_occurrences.source IS
  'template = materialized from schedule_rules; exception = edited/cancelled instance; one_off = not from a template.';
COMMENT ON COLUMN class_occurrences.schedule_rule_id IS
  'Template this occurrence was materialized from (Bandeja template_id).';

-- ============================================================================
-- STUDIO LOCALE
-- ============================================================================

ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'es';

COMMENT ON COLUMN studios.locale IS
  'BCP 47 locale for academy copy variants (es-ES pista, es-AR/es-PY cancha). Not the UI i18n language.';

-- ============================================================================
-- BOOKING: pending_payment + channel
-- ============================================================================

ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'pending_payment' BEFORE 'confirmed';

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web';

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_channel_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_channel_check
  CHECK (channel IN ('web', 'whatsapp', 'admin'));

-- ============================================================================
-- OVERLAP EXCLUSION (live DB). Demo mode enforces the same rule in JS.
-- Cancelled rows and NULL court/teacher do not participate.
-- ============================================================================

ALTER TABLE class_occurrences
  DROP CONSTRAINT IF EXISTS class_occurrences_court_no_overlap;

ALTER TABLE class_occurrences
  ADD CONSTRAINT class_occurrences_court_no_overlap
  EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (court_id IS NOT NULL AND COALESCE(is_cancelled, FALSE) = FALSE);

ALTER TABLE class_occurrences
  DROP CONSTRAINT IF EXISTS class_occurrences_coach_no_overlap;

ALTER TABLE class_occurrences
  ADD CONSTRAINT class_occurrences_coach_no_overlap
  EXCLUDE USING gist (
    teacher_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (teacher_id IS NOT NULL AND COALESCE(is_cancelled, FALSE) = FALSE);
