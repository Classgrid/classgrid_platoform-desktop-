-- =========================================================================
-- CLASSGRID EXAMINATION MODULE MIGRATION (SAFE RE-RUN)
-- Run securely in Supabase SQL Editor
-- Uses DROP IF EXISTS + CREATE for safe re-execution
-- =========================================================================

-- ─── 1. EXAMS TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,                             -- e.g., "Semester 1 Finals"
  type TEXT NOT NULL CHECK (type IN ('school', 'college')),
  academic_year_id UUID,
  semester INT,
  date_range_start DATE,
  date_range_end DATE,
  exam_fee_amount DECIMAL(10,2) DEFAULT 0,        -- 0 = no fee (school default)
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exams_org ON exams(org_id);
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_exams" ON exams;
CREATE POLICY "service_role_exams" ON exams
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ─── 2. EXAM TIMETABLES (Division-Based Assignment) ──────────────────
CREATE TABLE IF NOT EXISTS exam_timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL,
  division_id UUID,                               -- Division-based ✅ (exact mapping)
  pdf_url TEXT,                                   -- Original uploaded PDF backup
  structured_data JSONB,                          -- AI Extracted: [{date, day, subject, time}]
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Safe unique constraint (drop first if exists from previous run)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_timetables_exam_id_division_id_key'
  ) THEN
    ALTER TABLE exam_timetables ADD CONSTRAINT exam_timetables_exam_id_division_id_key UNIQUE (exam_id, division_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_timetables_org ON exam_timetables(org_id);
CREATE INDEX IF NOT EXISTS idx_exam_timetables_division ON exam_timetables(division_id);
ALTER TABLE exam_timetables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_exam_timetables" ON exam_timetables;
CREATE POLICY "service_role_exam_timetables" ON exam_timetables
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ─── 3. EXAM PAYMENTS (College Only, Optional) ───────────────────────
CREATE TABLE IF NOT EXISTS exam_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  payment_id TEXT,                                -- Gateway Transaction ID (Razorpay)
  paid_at TIMESTAMPTZ,                            -- Timestamp when payment confirmed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Safe unique constraint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_payments_exam_id_user_id_key'
  ) THEN
    ALTER TABLE exam_payments ADD CONSTRAINT exam_payments_exam_id_user_id_key UNIQUE (exam_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_payments_org ON exam_payments(org_id);
CREATE INDEX IF NOT EXISTS idx_exam_payments_user ON exam_payments(user_id);
ALTER TABLE exam_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_exam_payments" ON exam_payments;
CREATE POLICY "service_role_exam_payments" ON exam_payments
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Done ✅ Safe to re-run anytime.
