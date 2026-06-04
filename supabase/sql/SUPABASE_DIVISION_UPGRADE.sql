-- ═══════════════════════════════════════════════════════════
-- DIVISION-CENTRIC ARCHITECTURE — Extend divisions table
-- ═══════════════════════════════════════════════════════════

-- 1. Add new columns to existing divisions table
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'college';
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS division_name TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS class_teacher_id TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS assistant_teacher_id TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS sem_start_date DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS sem_end_date DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS sem2_start_date DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS sem2_end_date DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS academic_year_start DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS academic_year_end DATE;

-- 2. Add admission_type and category to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_type TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. Index for class_teacher_id lookups
CREATE INDEX IF NOT EXISTS idx_divisions_class_teacher 
    ON divisions(class_teacher_id) 
    WHERE class_teacher_id IS NOT NULL;

-- 4. Index for org_id + type for filtered queries
CREATE INDEX IF NOT EXISTS idx_divisions_org_type 
    ON divisions(org_id, type);
