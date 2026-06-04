-- ═══════════════════════════════════════════════════════════════════
-- CLASSGRID — QUALIFICATIONS SCHEMA UPGRADE
-- Run this ONCE in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE student_past_qualifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- DONE
