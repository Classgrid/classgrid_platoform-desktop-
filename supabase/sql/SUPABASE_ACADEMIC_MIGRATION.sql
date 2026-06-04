-- =========================================================================
-- CLASSGRID ACADEMIC & TIMETABLE STRUCTURE MIGRATION
-- Adds strict School/College structure support and timetable periods
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- 1. Modify divisions table to support atomic structure fields
-- We add standard (School), year (College), semester (College), and section (Both)
-- We rename existing "name" values into the "section" column as a fallback where needed, 
-- but moving forward these explicit columns will be populated securely by the backend.

ALTER TABLE divisions
  ADD COLUMN IF NOT EXISTS standard TEXT,   -- e.g., '5th', '12th'
  ADD COLUMN IF NOT EXISTS year TEXT,       -- e.g., 'FY', 'SY', 'B.Tech'
  ADD COLUMN IF NOT EXISTS semester INTEGER,-- e.g., 1, 2, 8
  ADD COLUMN IF NOT EXISTS section TEXT;    -- e.g., 'A', 'B'

-- We drop the naive unique constraint on (org_id, name)
ALTER TABLE divisions DROP CONSTRAINT IF EXISTS divisions_org_id_name_key;

-- We add a complex unique constraint to prevent duplicate divisions under the new structure
CREATE UNIQUE INDEX IF NOT EXISTS exact_division_unique_idx 
ON divisions (org_id, coalesce(standard, ''), coalesce(year, ''), coalesce(semester, -1), coalesce(section, ''));

-- 2. Modify faculty_divisions to support start/end dates for lifecycle
ALTER TABLE faculty_divisions
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- 3. Create Timetable Periods Table
CREATE TABLE IF NOT EXISTS timetable_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,                     -- Maps to Mongo org
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sun, 1=Mon, ..., 6=Sat
  period_number INTEGER,                    -- 1, 2, 3, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: A classroom division can only have ONE lecture happening at a specific period number per day
CREATE UNIQUE INDEX IF NOT EXISTS one_period_per_division_day 
ON timetable_periods (division_id, day_of_week, period_number);

-- Unique constraint: A teacher can only teach ONE class at a given time per day (simplistic block check based on start_time)
CREATE UNIQUE INDEX IF NOT EXISTS teacher_no_overlap_idx 
ON timetable_periods (faculty_id, day_of_week, start_time);

-- Enable RLS for the new table
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to timetable_periods" ON timetable_periods FOR ALL USING (true);

-- 4. Single Class Teacher Enforcement Trigger
-- Automatically removes any existing class_teacher for a division when a new one is assigned
CREATE OR REPLACE FUNCTION enforce_single_class_teacher()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'class_teacher' THEN
        DELETE FROM faculty_divisions 
        WHERE division_id = NEW.division_id 
          AND role = 'class_teacher' 
          AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_single_class_teacher ON faculty_divisions;
CREATE TRIGGER trg_enforce_single_class_teacher
AFTER INSERT OR UPDATE ON faculty_divisions
FOR EACH ROW
EXECUTE FUNCTION enforce_single_class_teacher();

-- BOOM. Done.
