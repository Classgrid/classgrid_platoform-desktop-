-- =========================================================================
-- CLASSGRID ACADEMIC PROMOTION SYSTEM
-- Production-grade lifecycle engine for student academic progression
-- Run in Supabase SQL Editor
-- =========================================================================

-- ─── 1. ACADEMIC YEARS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,                          -- "2025-2026"
  is_active BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

-- Only ONE active year per org (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS one_active_year_per_org
ON academic_years (org_id) WHERE is_active = true;

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to academic_years" ON academic_years
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ─── 2. DIVISION PROMOTIONS (MAPPING) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS division_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  from_division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  to_division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, from_division_id)
);

ALTER TABLE division_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to division_promotions" ON division_promotions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ─── 3. PROMOTION BATCHES (STATE MACHINE + METADATA) ──────────────────
CREATE TABLE IF NOT EXISTS promotion_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  from_academic_year_id UUID REFERENCES academic_years(id),
  to_academic_year_id UUID REFERENCES academic_years(id),
  status TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'running', 'completed', 'failed')),
  total_students INT DEFAULT 0,
  promoted_count INT DEFAULT 0,
  graduated_count INT DEFAULT 0,
  excluded_count INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by TEXT,                              -- admin user_id
  batch_created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE promotion_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to promotion_batches" ON promotion_batches
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ─── 4. PROMOTION LOGS (AUDIT TRAIL) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS promotion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_batch_id UUID NOT NULL REFERENCES promotion_batches(id),
  student_id UUID NOT NULL,
  org_id TEXT NOT NULL,
  from_division_id UUID,
  to_division_id UUID,
  from_standard INT,
  to_standard INT,
  from_year TEXT,
  to_year TEXT,
  from_semester INT,
  to_semester INT,
  from_academic_year_id UUID,
  to_academic_year_id UUID,
  new_status TEXT,                              -- 'active' or 'graduated'
  promoted_by TEXT,
  promoted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE promotion_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to promotion_logs" ON promotion_logs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_promotion_logs_batch
ON promotion_logs (promotion_batch_id);


-- ─── 5. STUDENT ACADEMIC HISTORY (PRE-PROMOTION SNAPSHOT) ─────────────
CREATE TABLE IF NOT EXISTS student_academic_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_batch_id UUID NOT NULL REFERENCES promotion_batches(id),
  student_id UUID NOT NULL,
  org_id TEXT,
  division_id UUID,
  standard INT,
  year TEXT,
  semester INT,
  academic_year_id UUID,
  status TEXT,
  snapshot_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE student_academic_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to student_academic_history" ON student_academic_history
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ─── 6. ALTER STUDENTS TABLE ──────────────────────────────────────────
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id),
  ADD COLUMN IF NOT EXISTS standard INT,
  ADD COLUMN IF NOT EXISTS year TEXT,
  ADD COLUMN IF NOT EXISTS semester INT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'graduated', 'failed', 'transferred')),
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Hard constraint: student cannot exist twice in the same academic year
-- Using a unique index with coalesce to handle NULLs safely
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_year_unique
ON students (user_id, coalesce(academic_year_id, '00000000-0000-0000-0000-000000000000'));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_students_org_year
ON students (org_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_students_division
ON students (division_id);


-- ─── 7. SUPABASE RPC: BATCH PROMOTE ──────────────────────────────────
-- This function does the entire promotion in one DB transaction.
-- Called from the backend with: supabase.rpc('execute_promotion', { ... })

CREATE OR REPLACE FUNCTION execute_promotion(
  p_batch_id UUID,
  p_org_id TEXT,
  p_to_academic_year_id UUID,
  p_excluded_ids UUID[],
  p_admin_id TEXT,
  p_org_type TEXT                               -- 'SCHOOL' or 'COLLEGE'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_student RECORD;
  v_next_standard INT;
  v_next_semester INT;
  v_next_year TEXT;
  v_next_division_id UUID;
  v_next_status TEXT;
  v_promoted INT := 0;
  v_graduated INT := 0;
  v_total INT := 0;
  v_mapping UUID;
  v_section TEXT;
  v_target_div_name TEXT;
BEGIN
  -- Mark batch as running
  UPDATE promotion_batches
  SET status = 'running', started_at = now()
  WHERE id = p_batch_id;

  -- Loop through eligible students
  FOR v_student IN
    SELECT s.*, d.name AS division_name
    FROM students s
    LEFT JOIN divisions d ON d.id = s.division_id
    WHERE s.org_id = p_org_id
      AND s.status = 'active'
      AND (s.academic_year_id IS NULL OR s.academic_year_id != p_to_academic_year_id)
      AND s.id != ALL(p_excluded_ids)
    ORDER BY s.name
  LOOP
    v_total := v_total + 1;

    -- 1. Snapshot current state
    INSERT INTO student_academic_history
      (promotion_batch_id, student_id, org_id, division_id, standard, year, semester, academic_year_id, status)
    VALUES
      (p_batch_id, v_student.id, v_student.org_id, v_student.division_id,
       v_student.standard, v_student.year, v_student.semester,
       v_student.academic_year_id, v_student.status);

    -- 2. Calculate next state
    v_next_status := 'active';

    IF p_org_type = 'SCHOOL' THEN
      v_next_standard := COALESCE(v_student.standard, 0) + 1;
      v_next_semester := v_student.semester;
      v_next_year := v_student.year;

      IF v_next_standard > 12 THEN
        v_next_status := 'graduated';
      END IF;

    ELSE
      -- COLLEGE
      v_next_semester := COALESCE(v_student.semester, 0) + 1;
      v_next_standard := v_student.standard;

      IF v_next_semester > 8 THEN
        v_next_status := 'graduated';
      ELSE
        v_next_year := CASE
          WHEN v_next_semester <= 2 THEN 'FY'
          WHEN v_next_semester <= 4 THEN 'SY'
          WHEN v_next_semester <= 6 THEN 'TY'
          ELSE 'BE'
        END;
      END IF;
    END IF;

    -- 3. Division mapping (check custom, fallback to same letter)
    IF v_next_status = 'graduated' THEN
      v_next_division_id := v_student.division_id;  -- keep as-is
    ELSE
      SELECT to_division_id INTO v_mapping
      FROM division_promotions
      WHERE org_id = p_org_id AND from_division_id = v_student.division_id
      LIMIT 1;

      IF v_mapping IS NOT NULL THEN
        v_next_division_id := v_mapping;
      ELSE
        -- Fallback: find division with same section letter in next Academic structure
        v_section := regexp_replace(v_student.division_name, '.*\s', '');

        IF p_org_type = 'SCHOOL' THEN
          v_target_div_name := v_next_standard::TEXT || 'th ' || v_section;
          -- Handle special ordinals
          IF v_next_standard = 1 THEN v_target_div_name := '1st ' || v_section;
          ELSIF v_next_standard = 2 THEN v_target_div_name := '2nd ' || v_section;
          ELSIF v_next_standard = 3 THEN v_target_div_name := '3rd ' || v_section;
          END IF;
        ELSE
          v_target_div_name := v_next_year || ' Sem ' || v_next_semester || ' ' || v_section;
        END IF;

        SELECT id INTO v_next_division_id
        FROM divisions
        WHERE org_id = p_org_id AND UPPER(name) = UPPER(v_target_div_name)
        LIMIT 1;

        -- Auto-create if missing (same naming pattern)
        IF v_next_division_id IS NULL AND v_target_div_name IS NOT NULL THEN
          INSERT INTO divisions (org_id, name)
          VALUES (p_org_id, v_target_div_name)
          RETURNING id INTO v_next_division_id;
        END IF;

        -- Final fallback: keep same division
        IF v_next_division_id IS NULL THEN
          v_next_division_id := v_student.division_id;
        END IF;
      END IF;
    END IF;

    -- 4. Update student
    UPDATE students SET
      standard = v_next_standard,
      semester = v_next_semester,
      year = v_next_year,
      division_id = v_next_division_id,
      academic_year_id = p_to_academic_year_id,
      status = v_next_status
    WHERE id = v_student.id;

    -- 5. Log
    INSERT INTO promotion_logs
      (promotion_batch_id, student_id, org_id,
       from_division_id, to_division_id,
       from_standard, to_standard,
       from_year, to_year,
       from_semester, to_semester,
       from_academic_year_id, to_academic_year_id,
       new_status, promoted_by)
    VALUES
      (p_batch_id, v_student.id, p_org_id,
       v_student.division_id, v_next_division_id,
       v_student.standard, v_next_standard,
       v_student.year, v_next_year,
       v_student.semester, v_next_semester,
       v_student.academic_year_id, p_to_academic_year_id,
       v_next_status, p_admin_id);

    IF v_next_status = 'graduated' THEN
      v_graduated := v_graduated + 1;
    ELSE
      v_promoted := v_promoted + 1;
    END IF;

  END LOOP;

  -- 6. Finalize batch
  UPDATE promotion_batches SET
    status = 'completed',
    total_students = v_total,
    promoted_count = v_promoted,
    graduated_count = v_graduated,
    excluded_count = array_length(p_excluded_ids, 1),
    completed_at = now()
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'success', true,
    'total', v_total,
    'promoted', v_promoted,
    'graduated', v_graduated,
    'excluded', COALESCE(array_length(p_excluded_ids, 1), 0)
  );

EXCEPTION WHEN OTHERS THEN
  -- NOTE: Since the function runs in a single transaction, this UPDATE
  -- will also be rolled back. The caller (Node.js backend) is responsible
  -- for marking the batch as 'failed' if the RPC call returns an error.
  -- We still return the error details for the caller to handle.

  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- DONE. Academic Promotion System ready.
