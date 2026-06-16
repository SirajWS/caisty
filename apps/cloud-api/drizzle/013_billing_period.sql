-- 013_billing_period.sql
-- Store monthly/yearly billing interval on subscriptions and invoices.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_period varchar(10);

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS billing_period varchar(10);

-- Backfill subscriptions from gross price (current catalog incl. VAT).
UPDATE subscriptions s
SET billing_period = CASE
  WHEN s.plan = 'starter' AND s.price_cents BETWEEN 1187 AND 1191 THEN 'monthly'
  WHEN s.plan = 'starter' AND s.price_cents BETWEEN 11779 AND 11783 THEN 'yearly'
  WHEN s.plan = 'starter' AND s.price_cents BETWEEN 12136 AND 12140 THEN 'yearly'
  WHEN s.plan = 'pro' AND s.price_cents BETWEEN 2377 AND 2381 THEN 'monthly'
  WHEN s.plan = 'pro' AND s.price_cents BETWEEN 23679 AND 23683 THEN 'yearly'
  WHEN s.plan = 'pro' AND s.price_cents BETWEEN 24276 AND 24280 THEN 'yearly'
  ELSE billing_period
END
WHERE billing_period IS NULL
  AND lower(s.plan) IN ('starter', 'pro');

-- Backfill invoices from linked subscription when available.
UPDATE invoices i
SET billing_period = s.billing_period
FROM subscriptions s
WHERE i.subscription_id = s.id
  AND i.billing_period IS NULL
  AND s.billing_period IS NOT NULL;
