-- ============================================================
-- CLASSGRID - RESULT ENGINE MIGRATION v3 (Phase 2)
-- Supports: School + College mode, Ranking, Extended Status,
-- SGPA/CGPA, Normalization, Grace, Best-of-N, DB Lock
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. RESULT SCHEMES
CREATE TABLE IF NOT EXISTS result_schemes (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                   TEXT NOT NULL,
    division_id              UUID,
    name                     TEXT NOT NULL,
    academic_year            TEXT,
    semester                 TEXT,
    rules_json               JSONB NOT NULL DEFAULT '{}',
    status                   TEXT NOT NULL DEFAULT 'draft',
    is_generating            BOOLEAN DEFAULT false,
    generation_time_seconds  FLOAT,
    last_student_count       INTEGER,
    created_by               TEXT,
    created_at               TIMESTAMPTZ DEFAULT now(),
    updated_at               TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT result_schemes_status_check
        CHECK (status IN ('draft', 'generated', 'published', 'locked'))
);

-- 2. RESULT SUBJECTS
CREATE TABLE IF NOT EXISTS result_subjects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id       UUID NOT NULL REFERENCES result_schemes(id) ON DELETE CASCADE,
    org_id          TEXT NOT NULL,
    subject_code    TEXT,
    subject_name    TEXT NOT NULL,
    course_type     TEXT DEFAULT 'THEORY',
    max_marks       INTEGER NOT NULL DEFAULT 100,
    pass_marks      INTEGER,
    credits         INTEGER DEFAULT 2,
    created_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT course_type_check
        CHECK (course_type IN ('THEORY', 'LAB', 'ELECTIVE'))
);

-- 3. RESULT MARKS (raw per-student, per-subject)
CREATE TABLE IF NOT EXISTS result_marks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id       UUID NOT NULL REFERENCES result_schemes(id) ON DELETE CASCADE,
    subject_id      UUID NOT NULL REFERENCES result_subjects(id) ON DELETE CASCADE,
    org_id          TEXT NOT NULL,
    student_id      TEXT NOT NULL,
    marks_obtained  FLOAT,
    is_absent       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(scheme_id, subject_id, student_id),
    CONSTRAINT absent_null_check
        CHECK (
            (is_absent = false AND marks_obtained IS NOT NULL)
            OR (is_absent = true AND marks_obtained IS NULL)
        )
);

-- 4. RESULTS (final computed output)
-- Phase 2: sgpa, scheme_rank, percentage_equivalent, extended statuses
CREATE TABLE IF NOT EXISTS results (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id              UUID NOT NULL REFERENCES result_schemes(id) ON DELETE CASCADE,
    org_id                 TEXT NOT NULL,
    student_id             TEXT NOT NULL,
    total_marks            FLOAT,
    max_total_marks        FLOAT,
    percentage             FLOAT,
    grade                  TEXT,
    grade_points           FLOAT,
    sgpa                   FLOAT,
    cgpa                   FLOAT,
    percentage_equivalent  FLOAT,
    earn_credits           INTEGER DEFAULT 0,
    total_credits          INTEGER DEFAULT 0,
    scheme_rank            INTEGER,
    status                 TEXT,
    result_detail          JSONB,
    version                INTEGER DEFAULT 1,
    generated_at           TIMESTAMPTZ DEFAULT now(),
    UNIQUE(scheme_id, student_id),
    CONSTRAINT results_status_check
        CHECK (status IN (
            'pass', 'fail', 'compartment',
            'distinction', 'first_class', 'higher_second_class', 'second_class'
        ))
);

-- ========================
-- ROW LEVEL SECURITY
-- ========================

ALTER TABLE result_schemes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_marks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE results         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_result_schemes" ON result_schemes
    USING ((auth.jwt() ->> 'org_id') = org_id OR (auth.jwt() ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() ->> 'org_id') = org_id);

CREATE POLICY "org_admin_result_subjects" ON result_subjects
    USING ((auth.jwt() ->> 'org_id') = org_id)
    WITH CHECK ((auth.jwt() ->> 'org_id') = org_id);

CREATE POLICY "org_admin_result_marks" ON result_marks
    USING ((auth.jwt() ->> 'org_id') = org_id)
    WITH CHECK ((auth.jwt() ->> 'org_id') = org_id);

-- Students only see published results
CREATE POLICY "student_read_own_published_results" ON results
    FOR SELECT USING (
        (auth.jwt() ->> 'org_id') = org_id
        AND (auth.jwt() ->> 'sub') = student_id
        AND EXISTS (
            SELECT 1 FROM result_schemes rs
            WHERE rs.id = results.scheme_id
            AND rs.status = 'published'
        )
    );

CREATE POLICY "admin_full_results" ON results
    USING ((auth.jwt() ->> 'org_id') = org_id)
    WITH CHECK ((auth.jwt() ->> 'org_id') = org_id);

-- ========================
-- INDEXES
-- ========================

CREATE INDEX IF NOT EXISTS idx_result_schemes_org    ON result_schemes(org_id);
CREATE INDEX IF NOT EXISTS idx_result_subjects_scheme ON result_subjects(scheme_id);
CREATE INDEX IF NOT EXISTS idx_result_marks_scheme   ON result_marks(scheme_id);
CREATE INDEX IF NOT EXISTS idx_result_marks_student  ON result_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_validation      ON result_marks(scheme_id, subject_id, student_id);
CREATE INDEX IF NOT EXISTS idx_results_scheme        ON results(scheme_id);
CREATE INDEX IF NOT EXISTS idx_results_student       ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_rank          ON results(scheme_id, percentage DESC);

-- ========================
-- IF TABLES ALREADY EXIST - Run these ALTERs separately
-- ========================
-- ALTER TABLE result_schemes ADD COLUMN IF NOT EXISTS is_generating BOOLEAN DEFAULT false;
-- ALTER TABLE result_schemes ADD COLUMN IF NOT EXISTS generation_time_seconds FLOAT;
-- ALTER TABLE result_schemes ADD COLUMN IF NOT EXISTS last_student_count INTEGER;
-- ALTER TABLE results ADD COLUMN IF NOT EXISTS sgpa FLOAT;
-- ALTER TABLE results ADD COLUMN IF NOT EXISTS scheme_rank INTEGER;
-- ALTER TABLE results ADD COLUMN IF NOT EXISTS percentage_equivalent FLOAT;
-- ALTER TABLE results DROP CONSTRAINT IF EXISTS results_status_check;
-- ALTER TABLE results ADD CONSTRAINT results_status_check CHECK (status IN ('pass','fail','compartment','distinction','first_class','higher_second_class','second_class'));

-- DONE
