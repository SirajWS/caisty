-- 012_add_stripe_customer_id.sql
-- Persist Stripe Customer ID for Billing Portal and API lookups.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;
