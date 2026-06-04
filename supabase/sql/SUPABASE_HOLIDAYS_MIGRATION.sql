-- ═══════════════════════════════════════════════════════════
-- HOLIDAYS TABLE — Auto-fetched festivals + admin-managed holidays
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    year INTEGER,
    end_date DATE,  -- Nullable: for multi-day holidays (Diwali vacation, winter break)
    is_holiday BOOLEAN DEFAULT false,
    source TEXT DEFAULT 'google' CHECK (source IN ('google', 'manual')),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Quick update for existing tables:
-- ALTER TABLE holidays ADD COLUMN IF NOT EXISTS year INTEGER;

-- Prevent duplicate festivals per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_unique
    ON holidays (org_id, title, date);

-- Fast lookups for upcoming holidays
CREATE INDEX IF NOT EXISTS idx_holidays_org_date
    ON holidays (org_id, date);

-- Fast lookups for is_holiday checks
CREATE INDEX IF NOT EXISTS idx_holidays_org_active
    ON holidays (org_id, date, is_holiday) WHERE is_holiday = true;

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES (optional — currently using service key)
-- ═══════════════════════════════════════════════════════════
-- ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
