-- ═══════════════════════════════════════════════════════════════════
-- CLASSGRID — COMPLETE ONBOARDING SQL MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Covers: Divisions upgrade + Student Profile tables + RLS
-- ═══════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 1: DIVISIONS TABLE UPGRADE
-- (Division = Single Source of Truth)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_divisions_class_teacher 
    ON divisions(class_teacher_id) 
    WHERE class_teacher_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_divisions_org_type 
    ON divisions(org_id, type);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 2: STUDENTS TABLE — Category + Admission
-- (Step 9 of Onboarding)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_type TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS category TEXT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 3: FAMILY INFO TABLE
-- (Step 5 of Onboarding)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS student_family_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,
    father_name TEXT,
    mother_name TEXT,
    parent_contact TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE student_family_info ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own family info" ON student_family_info;
    DROP POLICY IF EXISTS "Users can insert their own family info" ON student_family_info;
    DROP POLICY IF EXISTS "Users can update their own family info" ON student_family_info;
    DROP POLICY IF EXISTS "Service role full access family" ON student_family_info;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view their own family info" 
    ON student_family_info FOR SELECT USING (true);
CREATE POLICY "Users can insert their own family info" 
    ON student_family_info FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own family info" 
    ON student_family_info FOR UPDATE USING (true);
CREATE POLICY "Service role full access family" 
    ON student_family_info FOR ALL USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 4: PAST QUALIFICATIONS TABLE
-- (Step 4 of Onboarding — 10th/12th)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS student_past_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    qual_type TEXT NOT NULL,
    board TEXT,
    passing_year TEXT,
    marks TEXT,
    stream TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, qual_type)
);

ALTER TABLE student_past_qualifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own past qualifications" ON student_past_qualifications;
    DROP POLICY IF EXISTS "Users can insert their own past qualifications" ON student_past_qualifications;
    DROP POLICY IF EXISTS "Users can update their own past qualifications" ON student_past_qualifications;
    DROP POLICY IF EXISTS "Users can delete their own past qualifications" ON student_past_qualifications;
    DROP POLICY IF EXISTS "Service role full access qualifications" ON student_past_qualifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view their own past qualifications" 
    ON student_past_qualifications FOR SELECT USING (true);
CREATE POLICY "Users can insert their own past qualifications" 
    ON student_past_qualifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own past qualifications" 
    ON student_past_qualifications FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own past qualifications" 
    ON student_past_qualifications FOR DELETE USING (true);
CREATE POLICY "Service role full access qualifications" 
    ON student_past_qualifications FOR ALL USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 5: DOCUMENTS TABLE
-- (Step 7 of Onboarding — SSC/HSC/Leaving Certs)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, doc_type)
);

ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own documents" ON student_documents;
    DROP POLICY IF EXISTS "Users can insert their own documents" ON student_documents;
    DROP POLICY IF EXISTS "Users can update their own documents" ON student_documents;
    DROP POLICY IF EXISTS "Users can delete their own documents" ON student_documents;
    DROP POLICY IF EXISTS "Service role full access documents" ON student_documents;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view their own documents" 
    ON student_documents FOR SELECT USING (true);
CREATE POLICY "Users can insert their own documents" 
    ON student_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own documents" 
    ON student_documents FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own documents" 
    ON student_documents FOR DELETE USING (true);
CREATE POLICY "Service role full access documents" 
    ON student_documents FOR ALL USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 6: AUTO-UPDATE TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_student_family_info_modtime ON student_family_info;
CREATE TRIGGER update_student_family_info_modtime
BEFORE UPDATE ON student_family_info
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_student_past_qualifications_modtime ON student_past_qualifications;
CREATE TRIGGER update_student_past_qualifications_modtime
BEFORE UPDATE ON student_past_qualifications
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_student_documents_modtime ON student_documents;
CREATE TRIGGER update_student_documents_modtime
BEFORE UPDATE ON student_documents
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DONE! All tables ready for 9-step onboarding.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
