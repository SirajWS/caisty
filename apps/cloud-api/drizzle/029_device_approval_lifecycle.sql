-- Phase 1: Device approval lifecycle columns (foundation only — no status backfill).
-- Existing rows keep their current status (active / released). New columns are nullable.

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS pending_license_id TEXT REFERENCES licenses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Seat-consuming devices for a license (active + blocked with license_id set).
CREATE INDEX IF NOT EXISTS idx_devices_seat_by_license
  ON devices(license_id)
  WHERE license_id IS NOT NULL AND status IN ('active', 'blocked');

-- Pending approval lookups by target license (pending rows use pending_license_id, not license_id).
CREATE INDEX IF NOT EXISTS idx_devices_pending_license
  ON devices(pending_license_id)
  WHERE pending_license_id IS NOT NULL;

-- Fingerprint history within customer scope (not global — multi-tenant safe).
CREATE INDEX IF NOT EXISTS idx_devices_fingerprint_customer
  ON devices(customer_id, fingerprint)
  WHERE fingerprint IS NOT NULL AND customer_id IS NOT NULL;
