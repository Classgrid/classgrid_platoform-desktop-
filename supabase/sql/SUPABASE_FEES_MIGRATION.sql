-- ==============================================================================
-- FEES MANAGEMENT MODULE MIGRATION
-- Description: Fee structures, student fee records, and payment tracking
-- ==============================================================================

-- 1. Fee Structures (Admin-defined templates)
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    name TEXT NOT NULL,                          -- e.g. "FY B.Tech 2025-26 Sem 1"
    academic_year TEXT,                           -- e.g. "2025-26"
    division_id UUID,                            -- Nullable = applies to all divisions
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    due_date DATE,                               -- Overall due date
    late_fine_per_day NUMERIC(8,2) DEFAULT 0,    -- Optional late fine
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_struct_org ON fee_structures(org_id);
CREATE INDEX IF NOT EXISTS idx_fee_struct_div ON fee_structures(division_id);

-- 2. Fee Components (Breakdown within a structure)
CREATE TABLE IF NOT EXISTS fee_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                           -- e.g. "Tuition", "Exam", "Library"
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_comp_struct ON fee_components(structure_id);

-- 3. Student Fee Records (Generated per student from structures)
CREATE TABLE IF NOT EXISTS student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    student_id VARCHAR(255) NOT NULL,             -- Mongo User ID
    structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
    division_id UUID,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    pending_amount NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    due_date DATE,
    status TEXT DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid', 'overdue')),
    is_blocked BOOLEAN DEFAULT FALSE,             -- Block library/results if unpaid
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One fee record per student per structure
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_fee_unique
    ON student_fees (student_id, structure_id);

CREATE INDEX IF NOT EXISTS idx_sf_org ON student_fees(org_id);
CREATE INDEX IF NOT EXISTS idx_sf_student ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_sf_status ON student_fees(status);
CREATE INDEX IF NOT EXISTS idx_sf_division ON student_fees(division_id);

-- 4. Fee Payments (Transaction log)
CREATE TABLE IF NOT EXISTS fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'cheque', 'online', 'other')),
    reference_number TEXT,                        -- UTR / Cheque no / Receipt no
    notes TEXT,
    recorded_by VARCHAR(255),                     -- Admin/Teacher who recorded
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fp_org ON fee_payments(org_id);
CREATE INDEX IF NOT EXISTS idx_fp_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fp_student_fee ON fee_payments(student_fee_id);

-- Auto-update trigger for student_fees
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_student_fees_modtime') THEN
        CREATE FUNCTION update_student_fees_modtime()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

CREATE TRIGGER update_student_fees_modtime_trigger
    BEFORE UPDATE ON student_fees
    FOR EACH ROW EXECUTE FUNCTION update_student_fees_modtime();

-- Auto-update trigger for fee_structures
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_fee_struct_modtime') THEN
        CREATE FUNCTION update_fee_struct_modtime()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

CREATE TRIGGER update_fee_struct_modtime_trigger
    BEFORE UPDATE ON fee_structures
    FOR EACH ROW EXECUTE FUNCTION update_fee_struct_modtime();
