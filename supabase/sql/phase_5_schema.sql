-- ==========================================================
-- PHASE 5: ADVANCED CHAT FEATURES MIGRATION
-- ==========================================================

-- 1. Support for Pinned Messages
ALTER TABLE thread_messages 
ADD COLUMN is_pinned BOOLEAN DEFAULT false;

-- 2. Support for Edit History Logs
-- Store previous strings as an array of JSON objects: [{ "text": "...", "edited_at": "..." }]
ALTER TABLE thread_messages
ADD COLUMN edit_logs JSONB DEFAULT '[]'::jsonb;

-- 3. Scheduled Messages Table
CREATE TABLE scheduled_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    sender_name TEXT,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_group BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'pending' -- pending, sent, failed
);

-- Index for cron sweeping
CREATE INDEX idx_scheduled_messages_time ON scheduled_messages(scheduled_for) WHERE status = 'pending';
