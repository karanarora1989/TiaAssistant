-- ══════════════════════════════════════════════════════════════
-- Tia v1.3 Migration — Intelligent Follow-Up Intelligence
-- Run this in Supabase SQL editor AFTER all previous migrations
-- ══════════════════════════════════════════════════════════════

-- ── ai_calls: add outcome columns ─────────────────────────────

ALTER TABLE ai_calls
  ADD COLUMN IF NOT EXISTS outcome_state TEXT
    CHECK (outcome_state IN (
      'confirmed_done', 'on_track', 'committed_new_eta',
      'partial_progress', 'partial_progress_no_eta',
      'behind_no_commitment', 'no_commitment',
      'blocked_external', 'blocked_cannot_complete',
      'no_answer', 'no_answer_terminal', 'analysis_failed'
    )),
  ADD COLUMN IF NOT EXISTS call_summary TEXT;

-- ── tasks: add precise next-followup timestamp ─────────────────
-- next_action_date (DATE) is kept; next_followup_at (TIMESTAMPTZ) holds time

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ;

-- ── soul: add user name column ────────────────────────────────

ALTER TABLE soul
  ADD COLUMN IF NOT EXISTS user_name TEXT;

-- ── indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_calls_bland_call_id
  ON ai_calls (bland_call_id);

CREATE INDEX IF NOT EXISTS idx_ai_calls_task_completed
  ON ai_calls (task_id, completed_at DESC)
  WHERE status IN ('completed', 'no_answer');

CREATE INDEX IF NOT EXISTS idx_ai_calls_outcome_state
  ON ai_calls (outcome_state);

CREATE INDEX IF NOT EXISTS idx_tasks_next_followup_at
  ON tasks (next_followup_at);

-- ── helper function ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_followup_count(task_id UUID)
RETURNS void AS $$
  UPDATE tasks
  SET followup_count = COALESCE(followup_count, 0) + 1
  WHERE id = task_id;
$$ LANGUAGE sql;

-- ══════════════════════════════════════════════════════════════
-- NOTES:
-- 1. Run AFTER AI_CALLS_SCHEMA.sql and AGENT_CONTROL_SCHEMA.sql
-- 2. soul.user_name: populate via settings or onboarding flow
-- ══════════════════════════════════════════════════════════════
