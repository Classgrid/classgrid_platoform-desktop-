-- ═══════════════════════════════════════════════════════════
-- ONLINE EXAM MODULE — Supabase Tables
-- Completely separate from Quiz module (advanced_quizzes)
-- Run this in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Online Exams (created by faculty)
CREATE TABLE IF NOT EXISTS online_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    classroom_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    
    -- Sections: Array of { name, duration_minutes, questions: [...] }
    sections JSONB NOT NULL DEFAULT '[]',
    
    -- Marking: { correct: 4, incorrect: -1, unattempted: 0 }
    marking_scheme JSONB NOT NULL DEFAULT '{"correct": 4, "incorrect": -1, "unattempted": 0}',
    
    -- Settings: { kiosk_mode, max_tab_switches, show_results_after_end, shuffle_questions }
    settings JSONB NOT NULL DEFAULT '{"kiosk_mode": true, "max_tab_switches": 3, "show_results_after_end": true, "shuffle_questions": false}',
    
    -- Computed stats
    total_questions INT DEFAULT 0,
    total_marks INT DEFAULT 0,
    total_duration INT DEFAULT 0,  -- total minutes across all sections
    
    -- Lifecycle
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    attempt_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_online_exams_created_by ON online_exams(created_by);
CREATE INDEX IF NOT EXISTS idx_online_exams_classroom ON online_exams(classroom_id);
CREATE INDEX IF NOT EXISTS idx_online_exams_status ON online_exams(status);

-- 2. Online Exam Attempts (one per student per exam)
CREATE TABLE IF NOT EXISTS online_exam_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES online_exams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    
    -- Section-wise responses: { 0: { 0: { answer: 2, time_spent: 45 }, 1: {...} } }
    section_responses JSONB DEFAULT '{}',
    
    -- Question status map: { "s0_q0": "answered", "s0_q1": "review", ... }
    question_statuses JSONB DEFAULT '{}',
    
    -- Section time tracking: [5400, 5400, 5400] (seconds remaining per section)
    section_time_remaining JSONB DEFAULT '[]',
    
    -- Scoring
    score FLOAT DEFAULT 0,
    total_marks FLOAT DEFAULT 0,
    section_scores JSONB DEFAULT '[]',  -- [{ name, score, max }]
    
    -- Time analysis: { "s0_q0": 45, "s0_q1": 30 } (seconds per question)
    time_per_question JSONB DEFAULT '{}',
    
    -- Anti-cheat
    switch_count INT DEFAULT 0,
    focus_score INT DEFAULT 100,
    cheat_logs JSONB DEFAULT '[]',  -- [{ type, timestamp }]
    
    -- Lifecycle
    is_submitted BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One attempt per student per exam
    UNIQUE(exam_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_online_exam_attempts_exam ON online_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_online_exam_attempts_user ON online_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_online_exam_attempts_composite ON online_exam_attempts(exam_id, user_id);

-- Enable RLS (Row Level Security) - disabled for now since we handle auth in backend
ALTER TABLE online_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_exam_attempts ENABLE ROW LEVEL SECURITY;

-- Allow all operations from service role (our backend uses service key)
CREATE POLICY "Service role full access on online_exams" ON online_exams
    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on online_exam_attempts" ON online_exam_attempts
    FOR ALL USING (true) WITH CHECK (true);
