-- ══════════════════════════════════════════════════════════════
--  DEVICE TOKENS TABLE — FCM Push Notification Registration
--  Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- This table stores Firebase Cloud Messaging tokens for each
-- user's device. When a student, faculty, or admin installs the
-- Classgrid Android app, Kotlin fetches their unique FCM token
-- and React sends it here via POST /api/push/register-device.

CREATE TABLE IF NOT EXISTS device_tokens (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       TEXT NOT NULL,                          -- MongoDB user _id
  fcm_token     TEXT NOT NULL UNIQUE,                   -- Firebase device token
  platform      TEXT NOT NULL DEFAULT 'android',        -- android | ios | web (future)
  app_role      TEXT NOT NULL DEFAULT 'student',        -- student | faculty | admin
  org_id        TEXT,                                   -- Organization ID for role-based targeting
  last_active   TIMESTAMPTZ DEFAULT NOW(),              -- Last time token was refreshed
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user (when sending to specific users)
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id
  ON device_tokens(user_id);

-- Index for role-based broadcast within an org
CREATE INDEX IF NOT EXISTS idx_device_tokens_org_role
  ON device_tokens(org_id, app_role);

-- Index for token uniqueness enforcement and cleanup
CREATE INDEX IF NOT EXISTS idx_device_tokens_fcm_token
  ON device_tokens(fcm_token);

-- ══════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own tokens
CREATE POLICY "Users can view their own tokens"
  ON device_tokens FOR SELECT
  USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can insert their own tokens"
  ON device_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can delete their own tokens"
  ON device_tokens FOR DELETE
  USING (user_id = auth.uid()::TEXT);

-- Service role (backend) can do everything
-- (This is automatic when using the service_role key from Node.js)

-- ══════════════════════════════════════════════════════════════
--  AUTO-CLEANUP: Remove stale tokens older than 60 days
--  Run this as a Supabase scheduled function or cron job
-- ══════════════════════════════════════════════════════════════

-- DELETE FROM device_tokens
-- WHERE last_active < NOW() - INTERVAL '60 days';
