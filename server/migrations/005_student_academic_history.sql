-- ══════════════════════════════════════════════════════════
-- Classgrid: Student Academic History Table
-- Stores SSC/HSC/Diploma marks for the 13-step onboarding
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS student_academic_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    org_id TEXT NOT NULL,

    -- Qualification type
    qual_type TEXT NOT NULL CHECK (qual_type IN ('SSC', 'HSC', 'DIPLOMA', 'GRADUATION', 'POST_GRADUATION', 'CET', 'JEE', 'NEET', 'OTHER')),

    -- Board / University
    board_university TEXT DEFAULT '',

    -- Marks
    marks_obtained NUMERIC(7,2) DEFAULT NULL,
    marks_total NUMERIC(7,2) DEFAULT NULL,
    percentage NUMERIC(5,2) DEFAULT NULL,
    cgpa NUMERIC(4,2) DEFAULT NULL,
    grade TEXT DEFAULT NULL,

    -- Meta
    passing_year INTEGER DEFAULT NULL,
    stream TEXT DEFAULT NULL,           -- Science, Commerce, Arts
    seat_type TEXT DEFAULT NULL,        -- CAP, Management, Direct
    rank INTEGER DEFAULT NULL,          -- CET/JEE rank
    score NUMERIC(7,2) DEFAULT NULL,    -- CET/JEE score (percentile)

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One entry per qual_type per student per org
    UNIQUE(user_id, org_id, qual_type)
);

-- Fast lookups
CREATE INDEX IF NOT EXISTS idx_sah_user ON student_academic_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sah_org ON student_academic_history(org_id);

-- ══════════════════════════════════════════════════════════
-- Student Address Table
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS student_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    org_id TEXT NOT NULL,

    -- Permanent Address
    permanent_address_line1 TEXT DEFAULT '',
    permanent_address_line2 TEXT DEFAULT '',
    permanent_city TEXT DEFAULT '',
    permanent_state TEXT DEFAULT '',
    permanent_pincode TEXT DEFAULT '',
    permanent_country TEXT DEFAULT 'India',

    -- Correspondence Address
    correspondence_same_as_permanent BOOLEAN DEFAULT TRUE,
    correspondence_address_line1 TEXT DEFAULT '',
    correspondence_address_line2 TEXT DEFAULT '',
    correspondence_city TEXT DEFAULT '',
    correspondence_state TEXT DEFAULT '',
    correspondence_pincode TEXT DEFAULT '',
    correspondence_country TEXT DEFAULT 'India',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sa_user ON student_addresses(user_id);

-- ══════════════════════════════════════════════════════════
-- Enable RLS
-- ══════════════════════════════════════════════════════════
ALTER TABLE student_academic_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_addresses ENABLE ROW LEVEL SECURITY;

-- Service role bypass (backend uses service key)
CREATE POLICY "Service role bypass" ON student_academic_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON student_addresses FOR ALL USING (true) WITH CHECK (true);
