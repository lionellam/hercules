-- Idempotent: safe to run on every deploy or migrate.

CREATE TABLE IF NOT EXISTS allowed_emails (
  email      TEXT PRIMARY KEY,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  google_id     TEXT UNIQUE,
  display_name  TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT TRUE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  is_other    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_one_other_per_user
  ON categories (user_id) WHERE is_other;

CREATE TABLE IF NOT EXISTS expenses (
  id               BIGSERIAL PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES users(id),
  raw_input        TEXT NOT NULL,
  amount           NUMERIC(12, 2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'SGD',
  category_id      BIGINT NOT NULL REFERENCES categories(id),
  merchant         TEXT,
  date             DATE NOT NULL,
  other_sub_label  TEXT,
  remarks          TEXT,
  was_edited       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ,
  deleted_at       TIMESTAMPTZ,
  source_ref       TEXT  -- origin of imported records, e.g. 'cli:42'; NULL for app entries
);

CREATE UNIQUE INDEX IF NOT EXISTS expenses_user_source_ref
  ON expenses (user_id, source_ref) WHERE source_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS expenses_user_date
  ON expenses (user_id, date) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS parse_events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parse_events_user_time
  ON parse_events (user_id, created_at);
