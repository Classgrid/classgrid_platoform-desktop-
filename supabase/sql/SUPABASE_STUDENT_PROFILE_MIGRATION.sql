--- Migration script for Student Profile Sub-modules

-- 1. Family Info Table
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

-- RLS for Family Info
ALTER TABLE student_family_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own family info" ON student_family_info;
CREATE POLICY "Users can view their own family info" 
    ON student_family_info FOR SELECT 
    USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own family info" ON student_family_info;
CREATE POLICY "Users can insert their own family info" 
    ON student_family_info FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own family info" ON student_family_info;
CREATE POLICY "Users can update their own family info" 
    ON student_family_info FOR UPDATE 
    USING (auth.uid()::text = user_id);

-- 2. Past Qualifications Table
CREATE TABLE IF NOT EXISTS student_past_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    qual_type TEXT NOT NULL, -- 'ssc', 'hsc', 'diploma'
    board TEXT,
    passing_year TEXT,
    marks TEXT,
    stream TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, qual_type)
);

-- RLS for Past Qualifications
ALTER TABLE student_past_qualifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own past qualifications" ON student_past_qualifications;
CREATE POLICY "Users can view their own past qualifications" 
    ON student_past_qualifications FOR SELECT 
    USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own past qualifications" ON student_past_qualifications;
CREATE POLICY "Users can insert their own past qualifications" 
    ON student_past_qualifications FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own past qualifications" ON student_past_qualifications;
CREATE POLICY "Users can update their own past qualifications" 
    ON student_past_qualifications FOR UPDATE 
    USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own past qualifications" ON student_past_qualifications;
CREATE POLICY "Users can delete their own past qualifications" 
    ON student_past_qualifications FOR DELETE 
    USING (auth.uid()::text = user_id);

-- 3. Documents Table
CREATE TABLE IF NOT EXISTS student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    doc_type TEXT NOT NULL, -- 'ssc_cert', 'hsc_cert', 'leaving_cert', 'category_cert', 'other'
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, doc_type)
);

-- RLS for Documents
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own documents" ON student_documents;
CREATE POLICY "Users can view their own documents" 
    ON student_documents FOR SELECT 
    USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own documents" ON student_documents;
CREATE POLICY "Users can insert their own documents" 
    ON student_documents FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON student_documents;
CREATE POLICY "Users can update their own documents" 
    ON student_documents FOR UPDATE 
    USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON student_documents;
CREATE POLICY "Users can delete their own documents" 
    ON student_documents FOR DELETE 
    USING (auth.uid()::text = user_id);

-- Update triggers
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
