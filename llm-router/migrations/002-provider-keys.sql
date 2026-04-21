-- Phase 2.5-A — encrypted-at-rest provider key storage + audit log.
--
-- Apply with: docker exec -i factory-postgres psql -U factory pixel_factory < 002-provider-keys.sql

CREATE TABLE IF NOT EXISTS provider_keys (
  id            BIGSERIAL PRIMARY KEY,
  provider      TEXT        NOT NULL UNIQUE,    -- 'anthropic', 'openrouter', ...
  key_label     TEXT,                            -- friendly label, e.g. 'main' / 'staging'

  -- AES-256-GCM components (master key in ~/.config/factory-master-key)
  ciphertext    BYTEA       NOT NULL,
  iv            BYTEA       NOT NULL,            -- 12 bytes
  auth_tag      BYTEA       NOT NULL,            -- 16 bytes

  -- Lifecycle
  enabled       BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at  TIMESTAMPTZ,                     -- updated by router on each call (Phase 2.5-D)

  -- Display-only (NEVER store full key)
  key_prefix    TEXT,                            -- e.g. 'sk-ant-api03-' — for masked UI rendering
  key_suffix    TEXT,                            -- last 4 chars — for masked UI rendering
  key_length    INTEGER,                         -- char count — sanity check / format validation

  notes         TEXT
);

CREATE INDEX IF NOT EXISTS idx_provider_keys_enabled ON provider_keys (enabled, provider);

-- Audit trail. Records every change. Never contains key plaintext.
CREATE TABLE IF NOT EXISTS key_audit_log (
  id          BIGSERIAL PRIMARY KEY,
  ts          TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor       TEXT,                              -- nginx-auth user that made the change
  action      TEXT NOT NULL,                     -- 'create' | 'update' | 'toggle_on' | 'toggle_off' | 'delete'
  provider    TEXT NOT NULL,
  details     JSONB                              -- e.g. {"prefix":"sk-ant","length":108,"label":"main"}
);

CREATE INDEX IF NOT EXISTS idx_key_audit_log_ts       ON key_audit_log (ts DESC);
CREATE INDEX IF NOT EXISTS idx_key_audit_log_provider ON key_audit_log (provider, ts DESC);
