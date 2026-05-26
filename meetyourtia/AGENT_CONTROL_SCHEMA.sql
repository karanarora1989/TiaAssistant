-- ══════════════════════════════════════════════════════════════
-- Agent Control System - Database Schema
-- Run this in Supabase SQL editor AFTER AI_CALLS_SCHEMA.sql
-- ══════════════════════════════════════════════════════════════

-- ── UPDATE PEOPLE TABLE ────────────────────────────────────────

-- Add agent control fields to people
ALTER TABLE people ADD COLUMN IF NOT EXISTS agent_enabled BOOLEAN DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS agent_call BOOLEAN DEFAULT true;
ALTER TABLE people ADD COLUMN IF NOT EXISTS agent_remind BOOLEAN DEFAULT true;
ALTER TABLE people ADD COLUMN IF NOT EXISTS agent_followup BOOLEAN DEFAULT true;

-- ── UPDATE TASKS TABLE ─────────────────────────────────────────

-- Add agent control fields to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS agent_enabled BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS agent_source TEXT; 
  -- 'person' (inherited), 'manual' (user set), null (disabled)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS agent_call BOOLEAN DEFAULT true;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS agent_remind BOOLEAN DEFAULT true;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS agent_followup BOOLEAN DEFAULT true;

-- ── INDEXES ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_people_agent_enabled ON people(agent_enabled);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_enabled ON tasks(agent_enabled);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_source ON tasks(agent_source);

-- ══════════════════════════════════════════════════════════════
-- NOTES:
-- 1. Run this AFTER AI_CALLS_SCHEMA.sql
-- 2. Agent is disabled by default for all tasks
-- 3. If person has agent_enabled=true, tasks inherit settings
-- 4. User can override per task (agent_source='manual')
-- ══════════════════════════════════════════════════════════════
