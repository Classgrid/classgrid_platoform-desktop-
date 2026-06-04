-- =========================================================================
-- CONVOCATION & ALUMNI MODULE MIGRATION
-- Run in Supabase SQL Editor
-- =========================================================================

-- ─── 1. ALUMNI TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                         -- MongoDB user reference from students table
  org_id TEXT NOT NULL,
  graduation_year TEXT,                          -- e.g., "2026"
  degree TEXT,                                   -- e.g., "B.E Computer Engineering"
  final_cgpa DECIMAL(4,2),
  convocation_status TEXT DEFAULT 'pending' 
    CHECK (convocation_status IN ('pending', 'eligible', 'attended', 'skipped')),
  certificate_url TEXT,
  transcript_url TEXT,
  alumni_email TEXT,                             -- Post-graduation contact email
  current_company TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)                                -- Ensure a user only has one alumni record
);

-- RLS Policies
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to alumni" ON alumni
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alumni_org ON alumni (org_id);
CREATE INDEX IF NOT EXISTS idx_alumni_user ON alumni (user_id);


-- ─── 2. PATCH PRMOMOTION SYSTEM RPC (execute_promotion) ────────────────
-- We update the existing execute_promotion to insert into alumni upon graduation.

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
  v_target_ac_year_name TEXT;
BEGIN
  -- Mark batch as running
  UPDATE promotion_batches
  SET status = 'running', started_at = now()
  WHERE id = p_batch_id;

  -- Get target academic year name (for graduation year)
  SELECT name INTO v_target_ac_year_name FROM academic_years WHERE id = p_to_academic_year_id LIMIT 1;

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

      -- Allow dynamic graduation depending on course duration
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

    -- 6. Trigger Alumni Addition if Graduated
    IF v_next_status = 'graduated' THEN
      v_graduated := v_graduated + 1;
      
      INSERT INTO alumni (user_id, org_id, graduation_year, degree)
      VALUES (
        v_student.user_id, 
        p_org_id, 
        v_target_ac_year_name, 
        v_student.division_name -- We can default the degree to the student's last division string
      ) ON CONFLICT (user_id) DO NOTHING;

    ELSE
      v_promoted := v_promoted + 1;
    END IF;

  END LOOP;

  -- 7. Finalize batch
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
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;
