-- ==============================================================================
-- ACADEMIC PLANNING MIGRATION
-- Description: Creates the execution tracking schema for Faculty Academic Plans
-- Dependencies: requires 'course_subjects' table to exist
-- ==============================================================================

-- 1. Create the academic_plans table
CREATE TABLE IF NOT EXISTS academic_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    classroom_id VARCHAR(255) NOT NULL, -- MongoDB ObjectId mapped to a specific division + subject + teacher
    subject_id UUID NOT NULL REFERENCES course_subjects(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT academic_plans_classroom_id_key UNIQUE (classroom_id) -- 1 Plan per Classroom strictly
);

-- 2. Create the academic_plan_units table (Hierarchical groupings like 'Chapters')
CREATE TABLE IF NOT EXISTS academic_plan_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES academic_plans(id) ON DELETE CASCADE,
    unit_name TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the academic_plan_topics table (Granular tracking items)
CREATE TABLE IF NOT EXISTS academic_plan_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES academic_plan_units(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    lectures_count INT DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ongoing', 'completed')),
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: No RLS defined by default in migration scripts unless explicitly required, 
-- but you can enable it if your org requires strict Postgres-level RLS.
-- Since backend Node.js APIs usually verify permissions, this is optional.
-- Uncomment to enable structural RLS:
-- ALTER TABLE academic_plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE academic_plan_units ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE academic_plan_topics ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't already exist (often exists from previous migrations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_academic_plan_modtime') THEN
        CREATE FUNCTION update_academic_plan_modtime()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

-- Apply triggers
CREATE TRIGGER update_academic_plans_modtime
    BEFORE UPDATE ON academic_plans
    FOR EACH ROW EXECUTE FUNCTION update_academic_plan_modtime();

CREATE TRIGGER update_academic_plan_units_modtime
    BEFORE UPDATE ON academic_plan_units
    FOR EACH ROW EXECUTE FUNCTION update_academic_plan_modtime();

CREATE TRIGGER update_academic_plan_topics_modtime
    BEFORE UPDATE ON academic_plan_topics
    FOR EACH ROW EXECUTE FUNCTION update_academic_plan_modtime();

-- Add Indexes for performant hierarchy lookups
CREATE INDEX IF NOT EXISTS idx_academic_plans_classroom ON academic_plans(classroom_id);
CREATE INDEX IF NOT EXISTS idx_academic_plans_org ON academic_plans(org_id);
CREATE INDEX IF NOT EXISTS idx_academic_units_plan ON academic_plan_units(plan_id);
CREATE INDEX IF NOT EXISTS idx_academic_topics_unit ON academic_plan_topics(unit_id);
