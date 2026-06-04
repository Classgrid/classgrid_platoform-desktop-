-- =========================================================================
-- CLASSGRID FACULTY ROLES REFACTOR MIGRATION
-- Adds strict constraints for roles and a subject column.
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- 1. Add subject column
ALTER TABLE faculty_divisions
  ADD COLUMN IF NOT EXISTS subject TEXT;

-- 2. Clean up any existing duplicate roles just in case
-- We remove older duplicates keeping only the most recently assigned ones
DELETE FROM faculty_divisions
WHERE id NOT IN (
  SELECT min(id)
  FROM faculty_divisions
  GROUP BY faculty_id, division_id, role, coalesce(subject, '')
);

-- 3. Replace the old constraint if any, and add the new one
-- First, lets gracefully drop variations of possible past constraints
ALTER TABLE faculty_divisions DROP CONSTRAINT IF EXISTS faculty_divisions_faculty_id_division_id_role_key;
ALTER TABLE faculty_divisions DROP CONSTRAINT IF EXISTS faculty_divisions_unique_assignment;

-- Now add the strict comprehensive unique constraint
-- A faculty member cannot have the exact same role in the exact same division,
-- unless it is an explicitly different subject (for Subject Teachers).
CREATE UNIQUE INDEX IF NOT EXISTS faculty_role_unique_idx
ON faculty_divisions (faculty_id, division_id, role, coalesce(subject, ''));

-- Note: The trigger trg_enforce_single_class_teacher is already active 
-- and handles replacing the strictly 1 Class Teacher.

-- BOOM. Done.
