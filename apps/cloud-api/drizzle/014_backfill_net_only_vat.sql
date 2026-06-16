-- Optional: backfill invoices where Stripe synced net-only (tax=0, gross=net)
-- Review before running in production.

UPDATE invoices i
SET
  amount_net_cents = CASE
    WHEN s.plan = 'starter' AND i.billing_period = 'monthly' THEN 999
    WHEN s.plan = 'starter' AND i.billing_period = 'yearly' THEN 9900
    WHEN s.plan = 'pro' AND i.billing_period = 'monthly' THEN 1999
    WHEN s.plan = 'pro' AND i.billing_period = 'yearly' THEN 19900
    ELSE amount_net_cents
  END,
  amount_gross_cents = CASE
    WHEN s.plan = 'starter' AND i.billing_period = 'monthly' THEN 1189
    WHEN s.plan = 'starter' AND i.billing_period = 'yearly' THEN 11781
    WHEN s.plan = 'pro' AND i.billing_period = 'monthly' THEN 2379
    WHEN s.plan = 'pro' AND i.billing_period = 'yearly' THEN 23681
    ELSE amount_gross_cents
  END,
  amount_tax_cents = CASE
    WHEN s.plan = 'starter' AND i.billing_period = 'monthly' THEN 190
    WHEN s.plan = 'starter' AND i.billing_period = 'yearly' THEN 1881
    WHEN s.plan = 'pro' AND i.billing_period = 'monthly' THEN 380
    WHEN s.plan = 'pro' AND i.billing_period = 'yearly' THEN 3781
    ELSE amount_tax_cents
  END,
  amount_cents = CASE
    WHEN s.plan = 'starter' AND i.billing_period = 'monthly' THEN 1189
    WHEN s.plan = 'starter' AND i.billing_period = 'yearly' THEN 11781
    WHEN s.plan = 'pro' AND i.billing_period = 'monthly' THEN 2379
    WHEN s.plan = 'pro' AND i.billing_period = 'yearly' THEN 23681
    ELSE amount_cents
  END
FROM subscriptions s
WHERE i.subscription_id = s.id
  AND COALESCE(i.amount_tax_cents, 0) = 0
  AND i.currency = 'EUR'
  AND i.status = 'paid'
  AND i.billing_period IN ('monthly', 'yearly')
  AND i.amount_gross_cents IN (999, 9900, 1999, 19900);

UPDATE subscriptions s
SET price_cents = CASE
  WHEN s.plan = 'starter' AND s.billing_period = 'monthly' THEN 1189
  WHEN s.plan = 'starter' AND s.billing_period = 'yearly' THEN 11781
  WHEN s.plan = 'pro' AND s.billing_period = 'monthly' THEN 2379
  WHEN s.plan = 'pro' AND s.billing_period = 'yearly' THEN 23681
  ELSE price_cents
END
WHERE s.currency = 'EUR'
  AND s.billing_period IN ('monthly', 'yearly')
  AND s.price_cents IN (999, 9900, 1999, 19900);
