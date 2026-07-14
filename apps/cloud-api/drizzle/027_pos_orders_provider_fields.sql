-- Phase 7 Sprint 3.1: provider / online order metadata on pos_orders
ALTER TABLE pos_orders
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS provider_order_id TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS customer_note TEXT,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_pos_orders_org_platform_sold_at
  ON pos_orders (org_id, platform, sold_at)
  WHERE platform IS NOT NULL;
