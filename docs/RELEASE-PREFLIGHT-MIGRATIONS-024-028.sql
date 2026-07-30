-- =============================================================================
-- READ-ONLY preflight for migrations 024–028
-- DO NOT run against Production from CI or agent tooling without explicit approval.
-- No secrets. No writes. Paste only into a controlled DBA session if authorized.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 026: pos_shifts legacy vs new shape
-- Rename runs ONLY when ALL of:
--   - public.pos_shifts exists
--   - column opened_at exists
--   - column business_date does NOT exist
-- Then: ALTER TABLE pos_shifts RENAME TO pos_shifts_legacy_pre_53b;
-- Afterwards CREATE TABLE IF NOT EXISTS pos_shifts (... business_date ...)
-- Data is preserved under the legacy name; never DROP/TRUNCATE in 026.
-- ---------------------------------------------------------------------------

-- a) Only legacy table (opened_at, no business_date) — rename WILL run
SELECT
  'case_a_legacy_only' AS scenario,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pos_shifts'
  ) AS pos_shifts_exists,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pos_shifts' AND column_name = 'opened_at'
  ) AS has_opened_at,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pos_shifts' AND column_name = 'business_date'
  ) AS has_business_date,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pos_shifts_legacy_pre_53b'
  ) AS legacy_rename_target_exists;

-- b) Only new table (business_date present) — rename will NOT run
-- (use same SELECT as above; expect has_business_date = true)

-- c) Old and new structures simultaneously
--    - If current pos_shifts already has business_date: rename skipped.
--    - If pos_shifts_legacy_pre_53b already exists AND rename would target it:
--      rename would FAIL if executed — preflight must show target free before 026.
SELECT
  c.table_name,
  c.column_name,
  c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('pos_shifts', 'pos_shifts_legacy_pre_53b')
ORDER BY c.table_name, c.ordinal_position;

-- d) Table with opened_at (detail)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pos_shifts'
  AND column_name = 'opened_at';

-- e) Table with business_date (detail)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pos_shifts'
  AND column_name = 'business_date';

-- Optional row counts: only run AFTER confirming the table exists via information_schema.
-- SELECT COUNT(*)::bigint AS row_count FROM pos_shifts;
-- SELECT COUNT(*)::bigint AS row_count FROM pos_shifts_legacy_pre_53b;
-- SELECT COUNT(*)::bigint AS row_count FROM pos_receipt_events;

-- ---------------------------------------------------------------------------
-- 024 / 025 / 027 additive checks
-- ---------------------------------------------------------------------------

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pos_receipts'
  AND column_name = 'status';

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'pos_receipt_events';

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pos_orders'
  AND column_name IN (
    'platform', 'provider_order_id', 'customer_name', 'customer_phone',
    'customer_email', 'delivery_address', 'customer_note', 'payment_status'
  )
ORDER BY column_name;

-- ---------------------------------------------------------------------------
-- 028: licenses.max_devices nullable — NO bulk UPDATE in migration
-- Only: ALTER TABLE licenses ALTER COLUMN max_devices DROP NOT NULL;
-- Existing integers (1, 3, …) must remain unchanged.
-- ---------------------------------------------------------------------------

SELECT
  is_nullable,
  column_default,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'licenses'
  AND column_name = 'max_devices';

-- Distribution by plan (read-only). Expect Starter/Pro numeric; Business may be null after app writes.
SELECT
  lower(plan) AS plan,
  max_devices,
  COUNT(*)::bigint AS licenses_count
FROM licenses
GROUP BY lower(plan), max_devices
ORDER BY plan, max_devices NULLS LAST;

-- Starter / Pro must not already be NULL (would be unexpected before Business rollout)
SELECT id, plan, max_devices, status
FROM licenses
WHERE lower(plan) IN ('starter', 'pro')
  AND max_devices IS NULL
LIMIT 50;

-- Business rows (if any) before/after
SELECT id, plan, max_devices, status
FROM licenses
WHERE lower(plan) = 'business'
LIMIT 50;
