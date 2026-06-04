-- ============================================================
-- CLASSGRID — PREMIUM FEEDBACK MODULE
-- AI-Powered Qualitative Feedback System
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. FEEDBACK FORMS (Admin/Teacher creates)
CREATE TABLE IF NOT EXISTS feedback_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_type TEXT NOT NULL DEFAULT 'teacher' CHECK (target_type IN ('teacher', 'organization')),
    target_teacher_id TEXT,              -- MongoDB user _id of the teacher
    target_teacher_name TEXT,            -- Cached teacher name
    subject_name TEXT,                   -- Subject name (cached for display)
    classroom_id TEXT,                   -- MongoDB classroom _id
    applicability TEXT NOT NULL DEFAULT 'all' CHECK (applicability IN ('all', 'class', 'division')),
    division_id TEXT,                    -- division_id if scoped to a division
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    is_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
    allow_comments BOOLEAN DEFAULT true,
    anonymous BOOLEAN DEFAULT true,
    created_by TEXT NOT NULL,            -- MongoDB user _id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FEEDBACK QUESTIONS
CREATE TABLE IF NOT EXISTS feedback_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'qualitative' CHECK (question_type IN ('qualitative', 'rating', 'text')),
    display_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    options JSONB DEFAULT '["Good", "Better", "Best", "Excellent"]',
    ratings_map JSONB DEFAULT '{"Good": 2, "Better": 3, "Best": 4, "Excellent": 5}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FEEDBACK RESPONSES (one per question per student)
CREATE TABLE IF NOT EXISTS feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES feedback_questions(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,            -- MongoDB user _id
    org_id TEXT NOT NULL,
    response_value TEXT,                 -- 'Good', 'Better', 'Best', 'Excellent'
    rating_value INTEGER,               -- Mapped: Good=2, Better=3, Best=4, Excellent=5
    comment TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate submissions per question per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_response_unique 
    ON feedback_responses(form_id, question_id, student_id);

-- 4. FEEDBACK SUBMISSIONS (track completion per student per form)
CREATE TABLE IF NOT EXISTS feedback_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    org_id TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT true,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_submission_unique 
    ON feedback_submissions(form_id, student_id);

-- 5. FEEDBACK ANALYTICS (aggregated + AI insights)
CREATE TABLE IF NOT EXISTS feedback_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
    teacher_id TEXT,
    org_id TEXT NOT NULL,
    avg_rating FLOAT,
    total_responses INTEGER DEFAULT 0,
    participation_rate FLOAT DEFAULT 0,
    question_breakdown JSONB DEFAULT '{}',
    ai_insights JSONB,                  -- { strengths: [], weaknesses: [], suggestions: [] }
    performance_tag TEXT CHECK (performance_tag IN ('excellent', 'strong', 'average', 'needs_improvement')),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_analytics_unique 
    ON feedback_analytics(form_id, teacher_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fb_forms_org ON feedback_forms(org_id);
CREATE INDEX IF NOT EXISTS idx_fb_forms_status ON feedback_forms(status);
CREATE INDEX IF NOT EXISTS idx_fb_forms_teacher ON feedback_forms(target_teacher_id);
CREATE INDEX IF NOT EXISTS idx_fb_questions_form ON feedback_questions(form_id);
CREATE INDEX IF NOT EXISTS idx_fb_responses_form ON feedback_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_fb_responses_student ON feedback_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_fb_submissions_form ON feedback_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_fb_analytics_form ON feedback_analytics(form_id);

-- RLS
ALTER TABLE feedback_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_analytics ENABLE ROW LEVEL SECURITY;

-- Open policies (server uses service key)
DO $$
BEGIN
  DROP POLICY IF EXISTS "fb_forms_all" ON feedback_forms;
  DROP POLICY IF EXISTS "fb_questions_all" ON feedback_questions;
  DROP POLICY IF EXISTS "fb_responses_all" ON feedback_responses;
  DROP POLICY IF EXISTS "fb_submissions_all" ON feedback_submissions;
  DROP POLICY IF EXISTS "fb_analytics_all" ON feedback_analytics;
END $$;

CREATE POLICY "fb_forms_all" ON feedback_forms USING (true) WITH CHECK (true);
CREATE POLICY "fb_questions_all" ON feedback_questions USING (true) WITH CHECK (true);
CREATE POLICY "fb_responses_all" ON feedback_responses USING (true) WITH CHECK (true);
CREATE POLICY "fb_submissions_all" ON feedback_submissions USING (true) WITH CHECK (true);
CREATE POLICY "fb_analytics_all" ON feedback_analytics USING (true) WITH CHECK (true);
