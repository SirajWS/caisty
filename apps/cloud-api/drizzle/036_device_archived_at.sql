-- A1.1 follow-up: soft-archive POS devices from Super-Admin lists.
-- Does not delete rows, station codes, receipts, or org station counters.
-- Existing rows stay visible until archived_at is set (NULL = not archived).
--
-- Rollout (staging/local only unless explicitly authorized):
--   1. Deploy cloud-api that includes this column on the devices schema.
--   2. Apply this file once: ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
--   3. Reruns are safe (IF NOT EXISTS). Do not remove archived_at or delete rows.
--   4. Do not apply to production without a separate authorization.

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
