-- Business plan: replace NULL/unlimited default with a hard cap of 5 devices.
--
-- Scope:
--   - Only licenses where lower(plan) = 'business' AND max_devices IS NULL.
--   - Custom integer overrides (e.g. enterprise deals) are NOT touched.
--   - Non-business NULL rows (future enterprise/custom unlimited) are NOT touched.
--
-- Over-limit safety:
--   - Existing customers with more than five seat-consuming devices are NOT modified.
--   - This migration only sets the license cap; seat enforcement on new approvals follows in Phase 2+.

UPDATE licenses
SET max_devices = 5,
    updated_at = NOW()
WHERE lower(plan) = 'business'
  AND max_devices IS NULL;
