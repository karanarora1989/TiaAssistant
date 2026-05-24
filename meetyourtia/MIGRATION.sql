-- ══════════════════════════════════════════════════════════════
-- Tia Database Migration - Autonomous Assistant
-- Run this in Supabase SQL editor to upgrade existing database
-- ══════════════════════════════════════════════════════════════

-- ── STEP 1: Add new columns to tasks table ────────────────────

-- Delegation tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_from TEXT;

-- Change assigned_to from array to single text
-- First, create a temporary column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_single TEXT;

-- Migrate data: take first element from array
UPDATE tasks 
SET assigned_to_single = CASE 
  WHEN array_length(assigned_to, 1) > 0 THEN assigned_to[1]
  ELSE NULL
END;

-- Drop old column and rename new one
ALTER TABLE tasks DROP COLUMN IF EXISTS assigned_to;
ALTER TABLE tasks RENAME COLUMN assigned_to_single TO assigned_to;

-- Enhanced status tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status_details JSONB DEFAULT '{}';

-- Update status enum to include new values
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('not_started','wip','blocked','done','open'));

-- Migrate existing status values
UPDATE tasks SET status = 'not_started' WHERE status = 'open';

-- Now update constraint to only allow new values
ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('not_started','wip','blocked','done'));

-- Autonomous follow-up tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_action_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_followup_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS followup_count INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS needs_intervention BOOLEAN DEFAULT false;

-- ── STEP 2: Add email column to people table ──────────────────

ALTER TABLE people ADD COLUMN IF NOT EXISTS email TEXT;

-- ── STEP 5: Add due_time column to tasks table ────────────────

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TEXT;

-- ── STEP 3: Create indexes for new columns ────────────────────

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_from ON tasks(assigned_from);
CREATE INDEX IF NOT EXISTS idx_tasks_next_action_date ON tasks(next_action_date);
CREATE INDEX IF NOT EXISTS idx_tasks_needs_intervention ON tasks(needs_intervention);

-- ── STEP 4: Set assigned_from for existing tasks ──────────────

-- For existing tasks, set assigned_from to user_id if assigned_to exists
UPDATE tasks 
SET assigned_from = user_id 
WHERE assigned_to IS NOT NULL 
  AND assigned_to != '' 
  AND assigned_to != 'self'
  AND assigned_from IS NULL;

-- ══════════════════════════════════════════════════════════════
-- Migration Complete!
-- ══════════════════════════════════════════════════════════════

-- Verify migration
SELECT 
  COUNT(*) as total_tasks,
  COUNT(assigned_from) as delegated_tasks,
  COUNT(CASE WHEN assigned_to IS NULL OR assigned_to = 'self' THEN 1 END) as self_tasks
FROM tasks;
