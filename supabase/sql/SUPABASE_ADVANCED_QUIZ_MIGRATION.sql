-- ==============================================================================
-- 🚀 CLASSGRID ADVANCED QUIZ SYSTEM - PHASE 1 SCHEMA
-- Run this entire script in your Supabase SQL Editor
-- Target Database: SUPABASE_CHAT (bumxgscngzjadyozdpce)
-- ==============================================================================

-- 1. Create the Quizzes Table
CREATE TABLE advanced_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('manual', 'ai', 'google')),
    classroom_id UUID NOT NULL, -- Logical reference to MongoDB Classroom string/oid
    created_by TEXT NOT NULL,   -- Logical reference to MongoDB User string/oid
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    questions JSONB DEFAULT '[]'::jsonb, -- Array of { question_id, question, options, correct_answer }
    google_mappings JSONB DEFAULT '[]'::jsonb,
    google_sheet_id TEXT,
    google_form_link TEXT,      -- Google Form link for students to attempt quiz
    negative_marks FLOAT DEFAULT 0,
    show_results_after_end BOOLEAN DEFAULT TRUE,
    attempt_count INTEGER DEFAULT 0, -- Cached count for dashboard performance
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by classroom
CREATE INDEX idx_adv_quizzes_classroom ON advanced_quizzes(classroom_id);

-- 2. Create the Quiz Attempts Table
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,      -- Logical reference to MongoDB User
    quiz_id UUID REFERENCES advanced_quizzes(id) ON DELETE CASCADE,
    score FLOAT DEFAULT 0,      -- Float allows for negative marks
    switch_count INTEGER DEFAULT 0,
    focus_score INTEGER DEFAULT 100,
    status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'suspicious', 'review')),
    responses JSONB DEFAULT '[]'::jsonb, -- Array of { question_id, selected_answer }
    is_submitted BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, quiz_id) -- One attempt per user per quiz
);

-- Index for looking up a specific user's attempts
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
