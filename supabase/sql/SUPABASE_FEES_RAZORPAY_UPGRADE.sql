-- ==============================================================================
-- RAZORPAY UPGRADE FOR FEES MODULE
-- Description: Adds payment mode toggle and Razorpay tracking fields
-- Run AFTER SUPABASE_FEES_MIGRATION.sql
-- ==============================================================================

-- 1. Add payment_mode to fee_structures (admin chooses per structure)
ALTER TABLE fee_structures
    ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'manual'
    CHECK (payment_mode IN ('manual', 'razorpay', 'both'));

-- 2. Add Razorpay tracking to fee_payments
ALTER TABLE fee_payments
    ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
    ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
    ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
    ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'success'
    CHECK (payment_status IN ('success', 'pending', 'failed'));

-- Index for quick lookup by razorpay IDs
CREATE INDEX IF NOT EXISTS idx_fp_razorpay_order ON fee_payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_fp_razorpay_payment ON fee_payments(razorpay_payment_id);
