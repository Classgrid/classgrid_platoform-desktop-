-- ──────────────────────────────────────────────
-- Migration: Add Full-Text Search to chat_messages
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ──────────────────────────────────────────────

-- 1. Add a generated tsvector column for full-text search
-- This auto-updates whenever the 'message' column changes — zero maintenance.
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(message, ''))) STORED;

-- 2. Create a GIN index for fast full-text lookups
-- GIN indexes are optimized for tsvector and make searches nearly instant.
CREATE INDEX IF NOT EXISTS idx_chat_messages_search ON chat_messages USING GIN (search_vector);

-- 3. (Optional) If the above GENERATED ALWAYS syntax fails on your Supabase version,
-- use a trigger-based approach instead:
--
-- ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS search_vector tsvector;
--
-- CREATE OR REPLACE FUNCTION chat_messages_search_trigger() RETURNS trigger AS $$
-- BEGIN
--   NEW.search_vector := to_tsvector('english', coalesce(NEW.message, ''));
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER update_chat_messages_search_vector
--   BEFORE INSERT OR UPDATE ON chat_messages
--   FOR EACH ROW EXECUTE FUNCTION chat_messages_search_trigger();
--
-- UPDATE chat_messages SET search_vector = to_tsvector('english', coalesce(message, ''));
