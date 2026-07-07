-- Phase 2.2: POS sales sync foundation (orders, receipts, sale payments, sync batches/events).
-- Billing tables (payments, invoices) are unchanged.

CREATE TABLE IF NOT EXISTS pos_sync_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  pos_batch_id UUID NOT NULL,
  batch_sequence INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL DEFAULT 'processing',
  event_count INTEGER NOT NULL DEFAULT 0,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_sync_batches_org_device_pos_batch
  ON pos_sync_batches(org_id, device_id, pos_batch_id);

CREATE INDEX IF NOT EXISTS idx_pos_sync_batches_org_created
  ON pos_sync_batches(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pos_sync_batches_device
  ON pos_sync_batches(device_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pos_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_event_id UUID NOT NULL,
  batch_id UUID NOT NULL REFERENCES pos_sync_batches(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  event_type VARCHAR(32) NOT NULL,
  entity_local_id TEXT,
  status VARCHAR(32) NOT NULL,
  error_code VARCHAR(64),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_sync_events_sync_event_id
  ON pos_sync_events(sync_event_id);

CREATE INDEX IF NOT EXISTS idx_pos_sync_events_batch
  ON pos_sync_events(batch_id);

CREATE INDEX IF NOT EXISTS idx_pos_sync_events_org_status
  ON pos_sync_events(org_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS pos_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  local_order_id TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'closed',
  total_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  sold_at TIMESTAMPTZ NOT NULL,
  sync_batch_id UUID REFERENCES pos_sync_batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_orders_org_device_local
  ON pos_orders(org_id, device_id, local_order_id);

CREATE INDEX IF NOT EXISTS idx_pos_orders_org_sold_at
  ON pos_orders(org_id, sold_at DESC);

CREATE INDEX IF NOT EXISTS idx_pos_orders_org_customer_sold_at
  ON pos_orders(org_id, customer_id, sold_at DESC);

CREATE TABLE IF NOT EXISTS pos_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  line_index INTEGER NOT NULL,
  product_name TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  line_total_cents INTEGER NOT NULL,
  tax_rate_bps INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_order_lines_order_line
  ON pos_order_lines(order_id, line_index);

CREATE INDEX IF NOT EXISTS idx_pos_order_lines_org
  ON pos_order_lines(org_id);

CREATE TABLE IF NOT EXISTS pos_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  local_receipt_id TEXT NOT NULL,
  local_order_id TEXT,
  receipt_number TEXT,
  net_cents INTEGER NOT NULL,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  gross_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  sold_at TIMESTAMPTZ NOT NULL,
  fiscal_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  sync_batch_id UUID REFERENCES pos_sync_batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_receipts_org_device_local
  ON pos_receipts(org_id, device_id, local_receipt_id);

CREATE INDEX IF NOT EXISTS idx_pos_receipts_org_sold_at
  ON pos_receipts(org_id, sold_at DESC);

CREATE INDEX IF NOT EXISTS idx_pos_receipts_org_customer_sold_at
  ON pos_receipts(org_id, customer_id, sold_at DESC);

CREATE TABLE IF NOT EXISTS pos_sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  local_payment_id TEXT NOT NULL,
  local_order_id TEXT,
  local_receipt_id TEXT,
  method VARCHAR(32) NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  paid_at TIMESTAMPTZ NOT NULL,
  sync_batch_id UUID REFERENCES pos_sync_batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_sale_payments_org_device_local
  ON pos_sale_payments(org_id, device_id, local_payment_id);

CREATE INDEX IF NOT EXISTS idx_pos_sale_payments_org_paid_at
  ON pos_sale_payments(org_id, paid_at DESC);
