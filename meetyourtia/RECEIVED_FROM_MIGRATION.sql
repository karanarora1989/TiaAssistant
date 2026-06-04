-- Migration: Consolidate received_from + assigned_from → single received_from TEXT
-- Run in Supabase SQL editor BEFORE deploying code.

-- Step 1: Add new single-value column
ALTER TABLE tasks ADD COLUMN received_from_new TEXT;

-- Step 2: Populate from best available source
-- Priority: assigned_from first (was the actively-written single-string field),
-- then fall back to first element of old received_from array
UPDATE tasks
SET received_from_new = COALESCE(
  NULLIF(assigned_from, ''),
  received_from[1]   -- Postgres arrays are 1-indexed
);

-- Step 3: Drop old array column, rename new one
ALTER TABLE tasks DROP COLUMN received_from;
ALTER TABLE tasks RENAME COLUMN received_from_new TO received_from;

-- Step 4: assigned_from is kept for backward compatibility (not dropped).
-- New code does not write to it. Can be hard-dropped in a future cleanup migration.

-- Step 5: Index for lookups
CREATE INDEX IF NOT EXISTS idx_tasks_received_from ON tasks(received_from);

-- Verify
SELECT id, title, received_from, assigned_from FROM tasks LIMIT 10;
