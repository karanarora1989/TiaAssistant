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
  received_from     TEXT[]      DEFAULT '{}',
  assigned_to       TEXT[]      DEFAULT '{}',
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
  status            TEXT        DEFAULT 'open'
    CHECK (status IN ('open','done','blocked')),
  blocked_by        TEXT,
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
  role            TEXT,
  relationship    TEXT,
  sensitivity     TEXT        DEFAULT 'normal'
    CHECK (sensitivity IN ('normal','careful','critical')),
  task_count      INTEGER     DEFAULT 0,
  open_task_count INTEGER     DEFAULT 0,
  last_mentioned  TIMESTAMPTZ,
  phone_number    TEXT,
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
    CHECK (source IN ('voice','text','system'))
);

CREATE TABLE nudges (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  nudge_type  TEXT,
  read        BOOLEAN     DEFAULT false,
  acted_on    BOOLEAN,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscription_map (
  user_id                   TEXT PRIMARY KEY,
  razorpay_subscription_id  TEXT NOT NULL,
  plan_type                 TEXT CHECK (plan_type IN ('monthly','annual')),
  created_at                TIMESTAMPTZ DEFAULT now()
);
-- No RLS on subscription_map — service role only

-- ── INDEXES ─────────────────────────────────────────────────

CREATE INDEX idx_tasks_user_status
  ON tasks (user_id, status)
  WHERE archived = false;

CREATE INDEX idx_tasks_carry_over
  ON tasks (user_id, carried_over)
  WHERE status = 'open' AND archived = false;

CREATE INDEX idx_tasks_due_date
  ON tasks (user_id, due_date_iso)
  WHERE status = 'open' AND archived = false;

CREATE INDEX idx_tasks_entity
  ON tasks (user_id, entity_name);

CREATE INDEX idx_tasks_assigned
  ON tasks USING GIN (assigned_to);

CREATE INDEX idx_tasks_parent
  ON tasks (parent_task_id);

CREATE INDEX idx_tasks_domain
  ON tasks (user_id, task_domain, status)
  WHERE archived = false;

CREATE INDEX idx_people_open
  ON people (user_id, open_task_count DESC);

CREATE INDEX idx_entities_open
  ON entities (user_id, open_task_count DESC);

CREATE INDEX idx_history_task
  ON task_history (task_id, changed_at DESC);

CREATE INDEX idx_history_user
  ON task_history (user_id, changed_at DESC);

CREATE INDEX idx_nudges_unread
  ON nudges (user_id, read, created_at DESC);

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain        ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul         ENABLE ROW LEVEL SECURITY;
ALTER TABLE people       ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_own"
  ON tasks FOR ALL
  USING (user_id = auth.uid()::text);
-- NO DELETE POLICY — tasks are permanent records

CREATE POLICY "brain_own"
  ON brain FOR ALL
  USING (user_id = auth.uid()::text);

CREATE POLICY "soul_own"
  ON soul FOR ALL
  USING (user_id = auth.uid()::text);

CREATE POLICY "people_own"
  ON people FOR ALL
  USING (user_id = auth.uid()::text);

CREATE POLICY "entities_own"
  ON entities FOR ALL
  USING (user_id = auth.uid()::text);

CREATE POLICY "task_history_own"
  ON task_history FOR ALL
  USING (user_id = auth.uid()::text);

CREATE POLICY "nudges_own"
  ON nudges FOR ALL
  USING (user_id = auth.uid()::text);
