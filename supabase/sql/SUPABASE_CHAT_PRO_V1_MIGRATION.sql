-- ================================================================
-- 💬 SUPABASE ADVANCED GROUP CHAT PERMISSIONS (PRO V1)
-- ================================================================
-- Run this in the Supabase SQL Editor for your *CHAT Project*
-- ================================================================

-- 1. Chat group permission policies
ALTER TABLE chat_groups 
ADD COLUMN IF NOT EXISTS send_message_policy TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS edit_info_policy TEXT DEFAULT 'admin_only',
ADD COLUMN IF NOT EXISTS add_member_policy TEXT DEFAULT 'admin_only',
ADD COLUMN IF NOT EXISTS create_poll_policy TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS send_attachments_policy TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS require_message_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false;

-- 2. Safe policy constraints
ALTER TABLE chat_groups ADD CONSTRAINT chat_groups_send_message_policy_check CHECK (send_message_policy IN ('all', 'admin_only', 'admin_faculty'));
ALTER TABLE chat_groups ADD CONSTRAINT chat_groups_edit_info_policy_check CHECK (edit_info_policy IN ('admin_only', 'org_admin_only'));
ALTER TABLE chat_groups ADD CONSTRAINT chat_groups_add_member_policy_check CHECK (add_member_policy IN ('admin_only', 'admin_faculty', 'org_admin_only'));
ALTER TABLE chat_groups ADD CONSTRAINT chat_groups_create_poll_policy_check CHECK (create_poll_policy IN ('all', 'admin_only', 'admin_faculty'));
ALTER TABLE chat_groups ADD CONSTRAINT chat_groups_send_attachments_policy_check CHECK (send_attachments_policy IN ('all', 'admin_only', 'admin_faculty'));
ALTER TABLE chat_groups ADD CONSTRAINT chat_groups_group_type_check CHECK (
  group_type IN ('general', 'announcement', 'class', 'department', 'subject', 'exam', 'fees', 'admission', 'faculty', 'parent', 'transport', 'hostel', 'library', 'event')
);

-- 3. Message Status & Features
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned_by TEXT,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS requires_acknowledgement BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_status_check CHECK (status IN ('approved', 'pending', 'rejected'));

-- 4. ERP Acknowledgements Table
CREATE TABLE IF NOT EXISTS chat_message_acknowledgements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT,
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- 5. Audit Logs Table
CREATE TABLE IF NOT EXISTS chat_group_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL,
    actor_name TEXT,
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_chat_msg_ack_message_id ON chat_message_acknowledgements(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_ack_user_id ON chat_message_acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON chat_messages(is_pinned);
CREATE INDEX IF NOT EXISTS idx_chat_messages_requires_ack ON chat_messages(requires_acknowledgement);

-- 7. Scheduled Messages Table (Pro V2)
CREATE TABLE IF NOT EXISTS chat_scheduled_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    message TEXT NOT NULL,
    reply_to JSONB,
    attachments JSONB DEFAULT '[]'::jsonb,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_scheduled_messages ADD CONSTRAINT chat_scheduled_messages_status_check CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_chat_sched_msg_thread_id ON chat_scheduled_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_sched_msg_status_date ON chat_scheduled_messages(status, scheduled_for);
