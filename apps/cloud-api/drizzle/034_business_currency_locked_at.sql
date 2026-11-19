-- B4.1: persistent write-once business currency lock.

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS currency_locked_at TIMESTAMPTZ;

-- Backfill: lock orgs with financial history or a previously productive device.
-- Does not change currency values.
UPDATE business_profiles AS bp
SET currency_locked_at = NOW()
WHERE bp.currency_locked_at IS NULL
  AND (
    EXISTS (
      SELECT 1 FROM pos_receipts r WHERE r.org_id = bp.org_id
    )
    OR EXISTS (
      SELECT 1 FROM pos_orders o WHERE o.org_id = bp.org_id
    )
    OR EXISTS (
      SELECT 1
      FROM devices d
      WHERE d.org_id = bp.org_id
        AND (
          d.approved_at IS NOT NULL
          OR d.status IN ('active', 'released', 'blocked')
        )
    )
  );
