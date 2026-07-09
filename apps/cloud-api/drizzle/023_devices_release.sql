-- Soft-release metadata for POS devices (seat unbind without deleting sales history).
ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_devices_released_at
  ON devices(released_at DESC NULLS LAST)
  WHERE released_at IS NOT NULL;
