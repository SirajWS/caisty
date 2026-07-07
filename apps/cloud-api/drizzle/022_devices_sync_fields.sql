-- Phase 2.2: device telemetry fields for POS sales sync (no legacy table changes beyond devices).

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS app_version VARCHAR(64),
  ADD COLUMN IF NOT EXISTS last_sales_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS offline_queue_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_devices_last_sales_sync_at
  ON devices(last_sales_sync_at DESC NULLS LAST);
