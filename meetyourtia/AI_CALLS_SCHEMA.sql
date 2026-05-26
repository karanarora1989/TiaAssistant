-- ══════════════════════════════════════════════════════════════
-- AI Voice Calling System - Database Schema
-- Run this in Supabase SQL editor AFTER main schema
-- ══════════════════════════════════════════════════════════════

-- ── UPDATE EXISTING TABLES ─────────────────────────────────────

-- Add AI calling fields to soul (user profile)
ALTER TABLE soul ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE soul ADD COLUMN IF NOT EXISTS tia_voice_name TEXT DEFAULT 'Maya';
ALTER TABLE soul ADD COLUMN IF NOT EXISTS ai_calls_enabled BOOLEAN DEFAULT true;

-- Add AI calling fields to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS call_urgency TEXT 
  CHECK (call_urgency IN ('low','medium','high','critical'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS call_scheduled_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS call_attempts INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- ── NEW TABLES ─────────────────────────────────────────────────

-- AI Calls Log
CREATE TABLE IF NOT EXISTS ai_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  call_type TEXT NOT NULL, -- assignment, reminder, followup, escalation, user_escalation
  call_urgency TEXT NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  scheduled_at TIMESTAMPTZ NOT NULL,
  initiated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- scheduled, calling, completed, failed, no_answer
  duration_seconds INTEGER,
  transcript TEXT,
  analysis JSONB,
  bland_call_id TEXT,
  cost_usd DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Call Escalations
CREATE TABLE IF NOT EXISTS call_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  escalated_at TIMESTAMPTZ DEFAULT now(),
  user_notified BOOLEAN DEFAULT false,
  user_call_made BOOLEAN DEFAULT false,
  user_call_id UUID REFERENCES ai_calls(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- ── INDEXES ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_calls_task_id ON ai_calls(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_user_id ON ai_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_scheduled_at ON ai_calls(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ai_calls_status ON ai_calls(status);

CREATE INDEX IF NOT EXISTS idx_call_escalations_task_id ON call_escalations(task_id);
CREATE INDEX IF NOT EXISTS idx_call_escalations_user_id ON call_escalations(user_id);
CREATE INDEX IF NOT EXISTS idx_call_escalations_user_notified ON call_escalations(user_notified);

CREATE INDEX IF NOT EXISTS idx_tasks_call_scheduled_at ON tasks(call_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tasks_next_retry_at ON tasks(next_retry_at);

-- ── FUNCTIONS ──────────────────────────────────────────────────

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_calls_updated_at
  BEFORE UPDATE ON ai_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_calls_updated_at();

-- ══════════════════════════════════════════════════════════════
-- NOTES:
-- 1. Run this AFTER the main SUPABASE_SCHEMA.sql
-- 2. Requires Bland AI API key in environment
-- 3. User phone numbers collected during onboarding
-- ══════════════════════════════════════════════════════════════
