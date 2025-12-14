-- 011_invoice_improvements.sql
-- Add planName, paymentMethod, providerRef to invoices table

ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS plan_name text,
  ADD COLUMN IF NOT EXISTS payment_method varchar(20),
  ADD COLUMN IF NOT EXISTS provider_ref text;

-- Backfill planName from subscriptions if available
UPDATE invoices i
SET plan_name = (
  SELECT CASE 
    WHEN s.plan = 'starter' THEN 'Starter'
    WHEN s.plan = 'pro' THEN 'Pro'
    ELSE s.plan::text
  END
  FROM subscriptions s
  WHERE s.id = i.subscription_id
)
WHERE i.plan_name IS NULL AND i.subscription_id IS NOT NULL;

-- Backfill paymentMethod from provider
UPDATE invoices
SET payment_method = CASE 
  WHEN provider = 'paypal' THEN 'paypal'
  WHEN provider = 'stripe' THEN 'card'
  ELSE NULL
END
WHERE payment_method IS NULL AND provider IS NOT NULL;

