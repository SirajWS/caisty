-- Sprint 5.2B: append-only POS receipt lifecycle events (created, printed, reprinted).

CREATE TABLE IF NOT EXISTS pos_receipt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  receipt_id UUID NOT NULL REFERENCES pos_receipts(id) ON DELETE CASCADE,
  receipt_number TEXT,
  event_id UUID NOT NULL,
  event_type VARCHAR(32) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  actor TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  sync_batch_id UUID REFERENCES pos_sync_batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_receipt_events_event_id
  ON pos_receipt_events(event_id);

CREATE INDEX IF NOT EXISTS idx_pos_receipt_events_org_receipt
  ON pos_receipt_events(org_id, receipt_id);

CREATE INDEX IF NOT EXISTS idx_pos_receipt_events_org_occurred_at
  ON pos_receipt_events(org_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_pos_receipt_events_org_event_type
  ON pos_receipt_events(org_id, event_type);
