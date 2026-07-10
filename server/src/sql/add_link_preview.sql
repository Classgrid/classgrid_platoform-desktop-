-- ──────────────────────────────────────────────
-- Migration: Add link_preview column to chat_messages
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ──────────────────────────────────────────────

-- Add a JSONB column to store OpenGraph metadata (title, description, image, url)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS link_preview JSONB;
