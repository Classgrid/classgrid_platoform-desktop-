-- Run this in your Supabase SQL Editor

-- 1. Table for Comments on Announcements and Notes
CREATE TABLE IF NOT EXISTS content_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL,
    classroom_id TEXT,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster querying by content_id
CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON content_comments(content_id);

-- 2. Table for Organization-wide Direct Messages
CREATE TABLE IF NOT EXISTS org_direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    receiver_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying direct messages quickly
CREATE INDEX IF NOT EXISTS idx_org_direct_messages_org_id ON org_direct_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_org_direct_messages_participants 
ON org_direct_messages(sender_id, receiver_id);
