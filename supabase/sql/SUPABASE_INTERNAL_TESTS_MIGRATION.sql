-- ═══════════════════════════════════════════════════════════════════
-- CLASSGRID — INTERNAL TESTS MODULE MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Creates: internal_tests, internal_test_marks tables
-- ═══════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. INTERNAL TESTS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS internal_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    classroom_id TEXT,                  -- MongoDB Classroom _id (optional — for classroom-level tests)
    division_id UUID,                   -- Supabase division reference
    teacher_id TEXT NOT NULL,           -- MongoDB user._id
    test_name TEXT NOT NULL,            -- e.g. "Weekly Test 1", "Internal Test 3"
    subject TEXT NOT NULL,              -- e.g. "mathematics", "physics"
    description TEXT,
    test_date DATE NOT NULL,
    total_marks INTEGER NOT NULL CHECK (total_marks > 0),
    question_file_url TEXT,             -- Optional PDF upload URL
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. INTERNAL TEST MARKS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS internal_test_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES internal_tests(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,           -- MongoDB user._id
    marks_obtained DECIMAL,            -- NULL = not yet graded
    remarks TEXT,
    graded_by TEXT,                     -- MongoDB teacher._id
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- One entry per student per test
    UNIQUE(test_id, student_id)
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX IF NOT EXISTS idx_internal_tests_org ON internal_tests(org_id);
CREATE INDEX IF NOT EXISTS idx_internal_tests_teacher ON internal_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_internal_tests_division ON internal_tests(division_id);
CREATE INDEX IF NOT EXISTS idx_internal_tests_date ON internal_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_internal_tests_classroom ON internal_tests(classroom_id);

CREATE INDEX IF NOT EXISTS idx_internal_test_marks_test ON internal_test_marks(test_id);
CREATE INDEX IF NOT EXISTS idx_internal_test_marks_student ON internal_test_marks(student_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. ROW LEVEL SECURITY
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE internal_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_test_marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_internal_tests" ON internal_tests;
CREATE POLICY "service_role_internal_tests" ON internal_tests
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_internal_test_marks" ON internal_test_marks;
CREATE POLICY "service_role_internal_test_marks" ON internal_test_marks
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. AUTO-UPDATE TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP TRIGGER IF EXISTS update_internal_tests_modtime ON internal_tests;
CREATE TRIGGER update_internal_tests_modtime
BEFORE UPDATE ON internal_tests
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_internal_test_marks_modtime ON internal_test_marks;
CREATE TRIGGER update_internal_test_marks_modtime
BEFORE UPDATE ON internal_test_marks
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DONE! Internal Tests Module tables ready.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
