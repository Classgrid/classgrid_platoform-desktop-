-- ============================================================
-- Add 'deleted_for' column to chat_messages table
-- This column stores an array of user IDs who have chosen
-- "Delete for Me" on a message. The message stays in the DB
-- but is hidden from those users.
-- ============================================================

-- Add the column (text array, default empty)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS deleted_for TEXT[] DEFAULT '{}';

-- Create an index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted_for 
ON chat_messages USING GIN (deleted_for);
