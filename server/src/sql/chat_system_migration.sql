-- ═══════════════════════════════════════════════════════════
-- CLASSGRID CHAT SYSTEM — SUPABASE MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ═══════════════════════════════════════════════════════════

-- NOTE: Create tables in dependency order (groups before threads, messages before attachments)

-- ═══ GROUPS (must come BEFORE threads, since threads references groups) ═══
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  org_id TEXT NOT NULL,
  avatar_url TEXT,
  avatar_color TEXT DEFAULT '#1a73e8',
  permissions JSONB DEFAULT '{"send_messages": "all", "edit_info": "admin_only"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ THREADS (unifies DMs + Groups) ═══
CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('dm', 'group')),
  org_id TEXT NOT NULL,
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ THREAD MEMBERS ═══
CREATE TABLE IF NOT EXISTS chat_thread_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

-- ═══ MESSAGES ═══
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  user_avatar TEXT,
  message TEXT DEFAULT '' CHECK (char_length(message) <= 5000),
  reply_to JSONB,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ ATTACHMENTS (Multi-file support) ═══
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ POLLS ═══
CREATE TABLE IF NOT EXISTS chat_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  allow_multiple BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_by TEXT NOT NULL,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_poll_votes (
  poll_id UUID REFERENCES chat_polls(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (poll_id, user_id, option_id)
);

-- ═══ READ TRACKING ═══
CREATE TABLE IF NOT EXISTS message_reads (
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS thread_reads (
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (thread_id, user_id)
);

-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_thread_members_user ON chat_thread_members(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_members_thread ON chat_thread_members(thread_id);
CREATE INDEX IF NOT EXISTS idx_threads_org ON chat_threads(org_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_msg ON chat_threads(org_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON chat_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_thread_reads_user ON thread_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_thread ON chat_polls(thread_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON chat_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message ON chat_attachments(message_id);

-- ═══ ATOMIC MESSAGE SEND FUNCTION (RPC) ═══
CREATE OR REPLACE FUNCTION send_message_atomic(
  p_thread_id UUID,
  p_sender_id TEXT,
  p_sender_name TEXT,
  p_user_avatar TEXT DEFAULT NULL,
  p_msg TEXT DEFAULT '',
  p_reply JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE v_msg_id UUID;
BEGIN
  INSERT INTO chat_messages (thread_id, sender_id, sender_name, user_avatar, message, reply_to)
  VALUES (p_thread_id, p_sender_id, p_sender_name, p_user_avatar, p_msg, p_reply)
  RETURNING id INTO v_msg_id;

  UPDATE chat_threads SET
    last_message = CASE WHEN p_msg IS NOT NULL AND p_msg != '' THEN LEFT(p_msg, 100) ELSE '📎 Attachment' END,
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = p_thread_id;

  RETURN v_msg_id;
END;
$$ LANGUAGE plpgsql;
