-- ==============================================================================
-- WEEKLY TIMETABLE MODULE MIGRATION
-- Description: Creates timetable_slots (regular weekly schedule) and
--              extra_lectures (one-off additional lectures)
-- ==============================================================================

-- 1. Regular weekly timetable slots
CREATE TABLE IF NOT EXISTS timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    division_id UUID NOT NULL,
    day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject TEXT NOT NULL,
    teacher_name TEXT,
    teacher_id VARCHAR(255),            -- Mongo User ID of teacher
    room TEXT,                           -- Room / Lab number
    type TEXT DEFAULT 'lecture' CHECK (type IN ('lecture', 'lab', 'tutorial', 'practical')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate slots: same division + day + time = blocked
CREATE UNIQUE INDEX IF NOT EXISTS idx_timetable_no_dup
    ON timetable_slots (division_id, day, start_time);

-- One timetable per division constraint (enforced at slot level)
CREATE INDEX IF NOT EXISTS idx_timetable_org ON timetable_slots(org_id);
CREATE INDEX IF NOT EXISTS idx_timetable_division ON timetable_slots(division_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable_slots(day);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable_slots(teacher_id);

-- 2. Extra lectures (one-off, date-specific)
CREATE TABLE IF NOT EXISTS extra_lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    division_id UUID NOT NULL,
    date DATE NOT NULL,                  -- Specific date (not recurring)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject TEXT NOT NULL,
    teacher_name TEXT,
    teacher_id VARCHAR(255),
    room TEXT,
    added_by VARCHAR(255),               -- Who created this
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extra_org ON extra_lectures(org_id);
CREATE INDEX IF NOT EXISTS idx_extra_division ON extra_lectures(division_id);
CREATE INDEX IF NOT EXISTS idx_extra_date ON extra_lectures(date);

-- Auto-update trigger for timetable_slots
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_timetable_modtime') THEN
        CREATE FUNCTION update_timetable_modtime()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

CREATE TRIGGER update_timetable_slots_modtime
    BEFORE UPDATE ON timetable_slots
    FOR EACH ROW EXECUTE FUNCTION update_timetable_modtime();
