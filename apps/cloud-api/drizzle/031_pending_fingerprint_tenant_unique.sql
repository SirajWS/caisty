-- Phase 3 (prepared, not executed): tenant-scoped pending dedup when fingerprint is present.
-- Does NOT enforce global fingerprint uniqueness; released/rejected history rows are unaffected.
-- Rows with NULL fingerprint are excluded (Phase 2 bind without fingerprint may still race).

CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_pending_fingerprint_tenant
  ON devices (customer_id, org_id, fingerprint, pending_license_id)
  WHERE status = 'pending_approval'
    AND fingerprint IS NOT NULL
    AND pending_license_id IS NOT NULL;
