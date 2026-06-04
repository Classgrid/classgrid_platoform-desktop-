-- ═══════════════════════════════════════════════════════════════════
-- CLASSGRID — EVENT MODULE (ACADEMIC CALENDAR) MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Creates: org_events table + V2/V3 enhancements
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS org_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    created_by TEXT,                    -- MongoDB user._id
    updated_by TEXT,                    -- MongoDB user._id (V3 versioning track)
    
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('academic', 'exam', 'test', 'holiday', 'event')),
    description TEXT,
    
    -- V3 Timezone safety upgrade (TIMESTAMPTZ instead of DATE)
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    
    priority INTEGER DEFAULT 1,
    recurrence JSONB,                   -- {"freq": "WEEKLY", "until": "2024-12-31"}
    
    -- V3 Versioning
    version INTEGER DEFAULT 1,
    
    -- Scoped Fields
    year_id UUID,
    department TEXT,
    division_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Safely add new columns and alter types if table was created previously
DO $$
BEGIN
    BEGIN
        ALTER TABLE org_events ADD COLUMN priority INTEGER DEFAULT 1;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE org_events ADD COLUMN recurrence JSONB;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE org_events ADD COLUMN division_id UUID;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE org_events ADD COLUMN version INTEGER DEFAULT 1;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE org_events ADD COLUMN updated_by TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- Alter dates to TIMESTAMPTZ gracefully
ALTER TABLE org_events ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date::TIMESTAMPTZ;
ALTER TABLE org_events ALTER COLUMN end_date TYPE TIMESTAMPTZ USING end_date::TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_events_org ON org_events(org_id);
CREATE INDEX IF NOT EXISTS idx_org_events_date ON org_events(start_date);
CREATE INDEX IF NOT EXISTS idx_org_events_year ON org_events(year_id);
CREATE INDEX IF NOT EXISTS idx_org_events_dept ON org_events(department);
CREATE INDEX IF NOT EXISTS idx_org_events_division ON org_events(division_id);
CREATE INDEX IF NOT EXISTS idx_org_events_priority ON org_events(priority DESC);

-- RLS
ALTER TABLE org_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_org_events" ON org_events;
CREATE POLICY "service_role_org_events" ON org_events
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Auto Update
DROP TRIGGER IF EXISTS update_org_events_modtime ON org_events;
CREATE TRIGGER update_org_events_modtime
BEFORE UPDATE ON org_events
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Audit trigger function for versioning
CREATE OR REPLACE FUNCTION increment_event_version()
RETURNS TRIGGER AS $$
BEGIN
   IF NEW.id = OLD.id AND (
       NEW.title <> OLD.title OR 
       NEW.type <> OLD.type OR 
       NEW.start_date <> OLD.start_date OR 
       NEW.end_date IS DISTINCT FROM OLD.end_date
   ) THEN
       NEW.version = OLD.version + 1;
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_org_events_version ON org_events;
CREATE TRIGGER update_org_events_version
BEFORE UPDATE ON org_events
FOR EACH ROW EXECUTE PROCEDURE increment_event_version();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DONE! Org Events table ready.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
