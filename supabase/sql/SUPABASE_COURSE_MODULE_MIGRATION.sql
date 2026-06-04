-- ═══════════════════════════════════════════════════════════════════
-- CLASSGRID — COURSE / CURRICULUM MODULE MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Creates: courses, course_subjects tables
-- ═══════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. COURSES TABLE (Top-level grouping)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    name TEXT NOT NULL,               -- e.g. "FY", "SY", "Class 10", "B.Tech CS"
    type TEXT NOT NULL DEFAULT 'COLLEGE',  -- "SCHOOL" / "COLLEGE"
    description TEXT,
    year TEXT,                        -- College: "First Year", "Second Year"
    standard TEXT,                    -- School: "10th", "12th"
    course_name TEXT,                 -- College: "B.E", "B.Tech", "MBA"
    branch TEXT,                      -- College: "Computer Science", "IT"
    total_semesters INTEGER DEFAULT 2,-- College: total semesters in this course
    status TEXT DEFAULT 'active',     -- active / archived
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, name)
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. COURSE SUBJECTS TABLE (Per-semester subjects)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS course_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    org_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    subject_code TEXT,                -- e.g. "CS101", "MATH201"
    semester INTEGER,                 -- College: which semester (1,2,3...) | School: NULL
    credit_hours INTEGER,             -- optional
    subject_type TEXT DEFAULT 'theory', -- theory / practical / elective
    syllabus_url TEXT,                -- PDF/file URL
    resources JSONB DEFAULT '[]'::jsonb, -- [{ name, url, type }]
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, subject_name, semester)
);

-- Unique index for subjects where semester can be NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_subjects_unique
ON course_subjects (course_id, subject_name, COALESCE(semester, 0));

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX IF NOT EXISTS idx_courses_org ON courses(org_id);
CREATE INDEX IF NOT EXISTS idx_course_subjects_course ON course_subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_course_subjects_org ON course_subjects(org_id);
CREATE INDEX IF NOT EXISTS idx_course_subjects_semester ON course_subjects(course_id, semester);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. ROW LEVEL SECURITY
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to courses" ON courses;
CREATE POLICY "Allow full access to courses" ON courses FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow full access to course_subjects" ON course_subjects;
CREATE POLICY "Allow full access to course_subjects" ON course_subjects FOR ALL USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. AUTO-UPDATE TRIGGER
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP TRIGGER IF EXISTS update_courses_modtime ON courses;
CREATE TRIGGER update_courses_modtime
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_course_subjects_modtime ON course_subjects;
CREATE TRIGGER update_course_subjects_modtime
BEFORE UPDATE ON course_subjects
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. FACULTY ASSIGNMENTS TABLE (WHO teaches WHAT, WHERE)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS faculty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,                    -- MongoDB user._id reference
    subject_id UUID REFERENCES course_subjects(id) ON DELETE CASCADE,  -- NULL for class_teacher
    division_id UUID,                            -- References divisions table
    role TEXT NOT NULL CHECK (role IN ('class_teacher', 'subject_teacher', 'assistant_teacher')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Prevent exact duplicate assignments (same teacher, subject, division, role)
    UNIQUE(teacher_id, subject_id, division_id, role)
);

-- 🔥 PARTIAL UNIQUE INDEX: Only ONE class_teacher per division (CRITICAL)
CREATE UNIQUE INDEX IF NOT EXISTS one_class_teacher_per_division
ON faculty_assignments (division_id)
WHERE role = 'class_teacher';

-- Performance indexes (needed at scale)
CREATE INDEX IF NOT EXISTS idx_faculty_division ON faculty_assignments(division_id);
CREATE INDEX IF NOT EXISTS idx_faculty_teacher ON faculty_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_faculty_subject ON faculty_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_faculty_org ON faculty_assignments(org_id);

-- RLS
ALTER TABLE faculty_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_faculty_assignments" ON faculty_assignments;
CREATE POLICY "service_role_faculty_assignments" ON faculty_assignments
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_faculty_assignments_modtime ON faculty_assignments;
CREATE TRIGGER update_faculty_assignments_modtime
BEFORE UPDATE ON faculty_assignments
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DONE! Course Module + Faculty Assignments ready.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
