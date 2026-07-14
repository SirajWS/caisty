-- Sprint 5.3B: POS shift lifecycle snapshots (optional shift workflow).
-- If a legacy experimental pos_shifts table exists (opened_at schema), preserve it
-- under a renamed table and create the Sprint 5.3B shape additively.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pos_shifts'
      AND column_name = 'opened_at'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pos_shifts'
      AND column_name = 'business_date'
  ) THEN
    ALTER TABLE pos_shifts RENAME TO pos_shifts_legacy_pre_53b;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS pos_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  local_shift_id TEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  cashier TEXT,
  business_date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  opening_float_minor INTEGER NOT NULL DEFAULT 0,
  closing_float_minor INTEGER,
  previous_closing_float_minor INTEGER,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  schema_version INTEGER NOT NULL DEFAULT 1,
  sync_batch_id UUID REFERENCES pos_sync_batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_shifts_org_device_local
  ON pos_shifts(org_id, device_id, local_shift_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_shifts_device_open
  ON pos_shifts(device_id)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_pos_shifts_org_status
  ON pos_shifts(org_id, status);

CREATE INDEX IF NOT EXISTS idx_pos_shifts_org_business_date
  ON pos_shifts(org_id, business_date DESC);

CREATE INDEX IF NOT EXISTS idx_pos_shifts_org_device_started
  ON pos_shifts(org_id, device_id, started_at DESC);
