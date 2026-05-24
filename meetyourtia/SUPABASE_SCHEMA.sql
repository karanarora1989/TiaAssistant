-- ══════════════════════════════════════════════════════════════
-- Tia Database Schema
-- Run this entire block in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════

-- ── TABLES ─────────────────────────────────────────────────

CREATE TABLE tasks (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT        NOT NULL,
  title             TEXT        NOT NULL,
  transcript        TEXT,
  context           TEXT,
  
  -- Delegation tracking
  assigned_from     TEXT,       -- Who delegated this task (null for self-tasks)
  assigned_to       TEXT,       -- Who is responsible (null or "self" for self-tasks)
  received_from     TEXT[]      DEFAULT '{}',
  participants      TEXT[]      DEFAULT '{}',
  
  due_date          TEXT,
  due_date_iso      DATE,
  time_sensitivity  TEXT
    CHECK (time_sensitivity IN ('hard','soft','flexible')),
  task_domain       TEXT        DEFAULT 'work'
    CHECK (task_domain IN ('work','personal')),
  entity_type       TEXT,
  entity_name       TEXT,
  priority          TEXT
    CHECK (priority IN ('high','medium','low')),
  
  -- Enhanced status tracking
  status            TEXT        DEFAULT 'not_started'
    CHECK (status IN ('not_started','wip','blocked','done')),
  status_details    JSONB       DEFAULT '{}',
  blocked_by        TEXT,
  
  -- Autonomous follow-up tracking
  next_action_date  DATE,
  last_followup_at  TIMESTAMPTZ,
  followup_count    INTEGER     DEFAULT 0,
  needs_intervention BOOLEAN    DEFAULT false,
  
  parent_task_id    UUID        REFERENCES tasks(id) ON DELETE SET NULL,
  is_private        BOOLEAN     DEFAULT false,
  carried_over      BOOLEAN     DEFAULT false,
  carry_over_count  INTEGER     DEFAULT 0,
  is_recurring      BOOLEAN     DEFAULT false,
  recurrence        TEXT,
  capture_method    TEXT
    CHECK (capture_method IN ('voice','text')),
  last_modified_at  TIMESTAMPTZ,
  archived          BOOLEAN     DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE brain (
  user_id       TEXT        PRIMARY KEY,
  summary       JSONB       NOT NULL DEFAULT '{}',
  last_updated  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE soul (
  user_id       TEXT        PRIMARY KEY,
  document      JSONB       NOT NULL DEFAULT '{}',
  version       INTEGER     DEFAULT 1,
  last_updated  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE people (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL,
  name            TEXT        NOT NULL,
  email           TEXT,
  phone_number    TEXT,
  role            TEXT,
  relationship    TEXT,
  sensitivity     TEXT        DEFAULT 'normal'
    CHECK (sensitivity IN ('normal','careful','critical')),
  task_count      INTEGER     DEFAULT 0,
  open_task_count INTEGER     DEFAULT 0,
  last_mentioned  TIMESTAMPTZ,
  aliases         TEXT[]      DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE TABLE entities (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL,
  entity_name     TEXT        NOT NULL,
  entity_type     TEXT        NOT NULL,
  task_count      INTEGER     DEFAULT 0,
  open_task_count INTEGER     DEFAULT 0,
  last_mentioned  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entity_name)
);

CREATE TABLE task_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID        NOT NULL REFERENCES tasks(id),
  user_id       TEXT        NOT NULL,
  changed_at    TIMESTAMPTZ DEFAULT now(),
  change_type   TEXT        NOT NULL
    CHECK (change_type IN (
      'created','correction','circumstance_change',
      'enrichment','status_update','carry_over'
    )),
  field_changed TEXT        NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  reason        TEXT,
  source        TEXT
);

CREATE TABLE subscriptions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT        NOT NULL UNIQUE,
  plan              TEXT        NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','pro')),
  status            TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','cancelled','expired')),
  razorpay_subscription_id TEXT,
  razorpay_customer_id     TEXT,
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  cancel_at_period_end     BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ── INDEXES ────────────────────────────────────────────────

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date_iso);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_people_user_id ON people(user_id);
CREATE INDEX idx_entities_user_id ON entities(user_id);
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- ── ROW LEVEL SECURITY ─────────────────────────────────────

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Note: Policies are managed by service role key in production
-- For development, you can add policies here if needed

-- ── MIGRATION: Add email column to people table ────────────

-- Run this if upgrading from previous schema:
-- ALTER TABLE people ADD COLUMN IF NOT EXISTS email TEXT;
