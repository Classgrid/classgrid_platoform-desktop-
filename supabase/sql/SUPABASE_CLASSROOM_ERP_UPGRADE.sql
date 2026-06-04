-- ═══════════════════════════════════════════════════════════════════
-- CLASSGRID — CLASSROOM ERP UPGRADE MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Adds structured academic fields to classroom memberships
-- ═══════════════════════════════════════════════════════════════════

-- Add the new fields to classroom_memberships
ALTER TABLE classroom_memberships 
ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS subject_name TEXT,
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS semester INTEGER,
ADD COLUMN IF NOT EXISTS standard TEXT;

-- Create indexes for performance on these new lookup columns
CREATE INDEX IF NOT EXISTS idx_cm_division ON classroom_memberships(division_id);
CREATE INDEX IF NOT EXISTS idx_cm_academic ON classroom_memberships(year, branch, semester);

COMMENT ON COLUMN classroom_memberships.division_id IS 'Links this student/classroom back to the orgs academic structure';
