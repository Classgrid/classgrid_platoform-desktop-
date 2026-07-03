-- Adds durable disappearing-message settings for chat threads.
-- Run in Supabase SQL editor or through the project's migration runner.

ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS message_ttl INTEGER NOT NULL DEFAULT 0;

UPDATE chat_threads
SET message_ttl = 0
WHERE message_ttl IS NULL;

ALTER TABLE chat_threads
  ALTER COLUMN message_ttl SET DEFAULT 0;

ALTER TABLE chat_threads
  ALTER COLUMN message_ttl SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_threads_message_ttl_allowed'
  ) THEN
    ALTER TABLE chat_threads
      ADD CONSTRAINT chat_threads_message_ttl_allowed
      CHECK (message_ttl IN (0, 86400, 604800, 7776000));
  END IF;
END $$;

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_messages_expires_at
  ON chat_messages(expires_at)
  WHERE expires_at IS NOT NULL;