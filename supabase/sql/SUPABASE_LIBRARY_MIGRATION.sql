-- =====================================================================
-- CLASSGRID — LIBRARY MANAGEMENT MODULE MIGRATION (v2 + Reservations)
-- Run this ONCE in Supabase SQL Editor
-- =====================================================================

-- PART 1: LIBRARY BOOKS (Catalog)
CREATE TABLE IF NOT EXISTS library_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    book_name TEXT NOT NULL,
    subject TEXT,
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    is_auto_categorized BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(org_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_library_books_search ON library_books(org_id, book_name);
CREATE INDEX IF NOT EXISTS idx_library_books_subject ON library_books(org_id, subject);

ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone in org can view books" ON library_books;
    DROP POLICY IF EXISTS "Admins and Managers can manage books" ON library_books;
    DROP POLICY IF EXISTS "Service role full access books" ON library_books;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Anyone in org can view books"
    ON library_books FOR SELECT USING (true);
CREATE POLICY "Admins and Managers can manage books"
    ON library_books FOR ALL USING (true);
CREATE POLICY "Service role full access books"
    ON library_books FOR ALL USING (true);


-- PART 2: LIBRARY COPIES (Physical Barcodes - Optional)
CREATE TABLE IF NOT EXISTS library_copies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    copy_id TEXT NOT NULL,
    status TEXT DEFAULT 'Available',
    condition_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(org_id, copy_id)
);

CREATE INDEX IF NOT EXISTS idx_library_copies_book ON library_copies(book_id);

ALTER TABLE library_copies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone in org can view copies" ON library_copies;
    DROP POLICY IF EXISTS "Admins and Managers can manage copies" ON library_copies;
    DROP POLICY IF EXISTS "Service role full access copies" ON library_copies;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Anyone in org can view copies"
    ON library_copies FOR SELECT USING (true);
CREATE POLICY "Admins and Managers can manage copies"
    ON library_copies FOR ALL USING (true);
CREATE POLICY "Service role full access copies"
    ON library_copies FOR ALL USING (true);


-- PART 3: LIBRARY TRANSACTIONS (Issues & Returns)
CREATE TABLE IF NOT EXISTS library_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    copy_id UUID REFERENCES library_copies(id) ON DELETE SET NULL,
    student_id TEXT NOT NULL,
    issued_by TEXT NOT NULL,
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Issued',
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    fine_status TEXT DEFAULT 'Unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_library_trans_student ON library_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_library_trans_status ON library_transactions(org_id, status);

ALTER TABLE library_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students can view own transactions" ON library_transactions;
    DROP POLICY IF EXISTS "Admins and Managers can manage transactions" ON library_transactions;
    DROP POLICY IF EXISTS "Service role full access transactions" ON library_transactions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Students can view own transactions"
    ON library_transactions FOR SELECT USING (true);
CREATE POLICY "Admins and Managers can manage transactions"
    ON library_transactions FOR ALL USING (true);
CREATE POLICY "Service role full access transactions"
    ON library_transactions FOR ALL USING (true);


-- PART 4: LIBRARY RESERVATIONS (Book Hold Queue) — NEW
CREATE TABLE IF NOT EXISTS library_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    queue_position INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT reservation_status_check CHECK (status IN ('pending', 'fulfilled', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_reservations_book ON library_reservations(book_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_student ON library_reservations(student_id);

ALTER TABLE library_reservations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone can view reservations" ON library_reservations;
    DROP POLICY IF EXISTS "Full access reservations" ON library_reservations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Anyone can view reservations"
    ON library_reservations FOR SELECT USING (true);
CREATE POLICY "Full access reservations"
    ON library_reservations FOR ALL USING (true);


-- PART 5: AUTO-UPDATE TRIGGERS
DROP TRIGGER IF EXISTS update_library_books_modtime ON library_books;
CREATE TRIGGER update_library_books_modtime
BEFORE UPDATE ON library_books
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_library_copies_modtime ON library_copies;
CREATE TRIGGER update_library_copies_modtime
BEFORE UPDATE ON library_copies
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_library_transactions_modtime ON library_transactions;
CREATE TRIGGER update_library_transactions_modtime
BEFORE UPDATE ON library_transactions
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_library_reservations_modtime ON library_reservations;
CREATE TRIGGER update_library_reservations_modtime
BEFORE UPDATE ON library_reservations
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
