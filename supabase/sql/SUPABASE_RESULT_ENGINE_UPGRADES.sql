-- ============================================================
-- CLASSGRID - RESULT ENGINE UNIVERSITY UPGRADES
-- Adds EduPlus-style metadata without replacing existing tables.
-- ============================================================

ALTER TABLE result_subjects
    ADD COLUMN IF NOT EXISTS course_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS teacher_id TEXT;

ALTER TABLE result_marks
    ADD COLUMN IF NOT EXISTS internal_marks DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS external_marks DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS seat_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_backlog BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS passed_in_reexam BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ordinance_applied VARCHAR(100);

ALTER TABLE results
    ADD COLUMN IF NOT EXISTS seat_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS snapshot_student_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS snapshot_prn VARCHAR(100),
    ADD COLUMN IF NOT EXISTS snapshot_abc_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS snapshot_father_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS snapshot_mother_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS snapshot_dob DATE,
    ADD COLUMN IF NOT EXISTS snapshot_eligibility_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS snapshot_pattern VARCHAR(50),
    ADD COLUMN IF NOT EXISTS snapshot_program VARCHAR(150),
    ADD COLUMN IF NOT EXISTS snapshot_college VARCHAR(255);

CREATE TABLE IF NOT EXISTS result_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID REFERENCES result_schemes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    changed_by TEXT,
    reason TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_result_subjects_teacher ON result_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_result_audit_logs_scheme ON result_audit_logs(scheme_id);
CREATE INDEX IF NOT EXISTS idx_result_audit_logs_student ON result_audit_logs(student_id);
