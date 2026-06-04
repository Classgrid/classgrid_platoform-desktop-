-- Create Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    organization_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    max_points INTEGER DEFAULT 100, -- Corresponds to total_marks
    attachments JSONB DEFAULT '[]', -- JSON array of file links / uploads
    status TEXT DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Depending on your exact DB setup, you might want indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON public.assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON public.assignments(teacher_id);


-- Create Assignment Submissions Table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    classroom_id TEXT NOT NULL,
    organization_id TEXT,
    submitted_file JSONB, -- Stores { originalName, fileUrl, fileType }
    status TEXT NOT NULL CHECK (status IN ('submitted', 'late', 'returned', 'not_submitted')),
    grade NUMERIC, -- Corresponds to marks
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id) -- Only one active submission record per student per assignment
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.assignment_submissions(student_id);


-- Create Classroom Students (Mapping Table)
CREATE TABLE IF NOT EXISTS public.classroom_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(classroom_id, student_id)
);


-- Setup Storage Buckets for Assignments and Submissions
-- IMPORTANT: Run these in Supabase SQL Editor if storage.buckets doesn't yet exist. 
-- Alternatively, create them manually via the Supabase Dashboard -> Storage UI.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignment-files', 'assignment-files', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-submissions', 'student-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public reading of assignment-files (adjust based on your security policies)
CREATE POLICY "Public assignment files read access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'assignment-files' );

-- Policies for inserting assignment-files
CREATE POLICY "Public assignment files insert access" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'assignment-files' );

-- Policies for inserting student-submissions
CREATE POLICY "Public student submissions insert access" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'student-submissions' );

CREATE POLICY "Public student submissions read access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'student-submissions' );
