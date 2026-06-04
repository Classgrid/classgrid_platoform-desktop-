-- ═══════════════════════════════════════════════════════════
-- CHAT REACTIONS TABLE — SUPABASE MIGRATION
-- Run this in your Chat Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ═══ REACTIONS TABLE ═══
-- Stores emoji reactions on chat messages (one row per user+message+emoji)
CREATE TABLE IF NOT EXISTS chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_reactions_message ON chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON chat_reactions(user_id);

-- ═══ RLS ═══
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

-- Allow read for all (needed for loading reactions with messages)
CREATE POLICY "Allow read reactions"
ON chat_reactions FOR SELECT USING (true);

-- Allow insert/delete via service role (backend)
CREATE POLICY "Allow insert reactions"
ON chat_reactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete reactions"
ON chat_reactions FOR DELETE USING (true);
