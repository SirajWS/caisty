-- Sprint 5.1: Receipt lifecycle foundation — business status on pos_receipts.
-- All existing and new receipts start as 'active'. Future sprints add transitions.

ALTER TABLE pos_receipts
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_pos_receipts_org_status_sold_at
  ON pos_receipts(org_id, status, sold_at DESC);
