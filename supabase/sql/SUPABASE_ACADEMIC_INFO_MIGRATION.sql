-- ═══════════════════════════════════════════════════════════
-- STUDENT ACADEMIC INFO TABLE
-- Run this in the PRIMARY Supabase project (chat/meetings DB)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS student_academic_info (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         TEXT NOT NULL UNIQUE,           -- MongoDB user _id (string)
    school_name     TEXT DEFAULT '',
    branch_department TEXT DEFAULT '',
    class_year      TEXT DEFAULT '',
    course_name     TEXT DEFAULT '',
    batch_semester  TEXT DEFAULT '',
    division_section TEXT DEFAULT '',
    roll_number     TEXT DEFAULT '',
    prn             TEXT DEFAULT '',
    admission_number TEXT DEFAULT '',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_academic_info_user_id ON student_academic_info(user_id);

-- PRN Index (Added as per your suggestion)
CREATE INDEX IF NOT EXISTS idx_academic_info_prn ON student_academic_info(prn);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_academic_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_academic_info_updated_at ON student_academic_info;
CREATE TRIGGER trg_academic_info_updated_at
    BEFORE UPDATE ON student_academic_info
    FOR EACH ROW
    EXECUTE FUNCTION update_academic_info_updated_at();
