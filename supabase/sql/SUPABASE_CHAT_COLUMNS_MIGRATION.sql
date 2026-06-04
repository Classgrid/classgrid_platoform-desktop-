-- ══════════════════════════════════════════════════════════════
-- CHAT FILE & READ COLUMNS MIGRATION
-- Run in your Supabase SQL editor (Chat project / SUPABASE_CHAT_URL)
-- ══════════════════════════════════════════════════════════════

-- ── org_direct_messages ─────────────────────────────────────
ALTER TABLE org_direct_messages
  ADD COLUMN IF NOT EXISTS file_url    TEXT,
  ADD COLUMN IF NOT EXISTS file_name   TEXT,
  ADD COLUMN IF NOT EXISTS file_type   TEXT,
  ADD COLUMN IF NOT EXISTS file_size   BIGINT,
  ADD COLUMN IF NOT EXISTS read_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reply_to    JSONB;

-- ── classroom_messages ───────────────────────────────────────
ALTER TABLE classroom_messages
  ADD COLUMN IF NOT EXISTS file_url    TEXT,
  ADD COLUMN IF NOT EXISTS file_name   TEXT,
  ADD COLUMN IF NOT EXISTS file_type   TEXT,
  ADD COLUMN IF NOT EXISTS file_size   BIGINT,
  ADD COLUMN IF NOT EXISTS reply_to    JSONB;

-- ── Index for fast unread count queries ──────────────────────
CREATE INDEX IF NOT EXISTS idx_org_dm_read
  ON org_direct_messages (receiver_id, read_at)
  WHERE read_at IS NULL;

-- ── Ensure realtime is enabled ────────────────────────────────
-- (These are already enabled, running them again throws an error)
-- ALTER PUBLICATION supabase_realtime ADD TABLE org_direct_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE classroom_messages;
