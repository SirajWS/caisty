-- 015_fix_open_invoice_amounts.sql
-- Align open/pending invoices + pending subscriptions to current catalog (net + 19 % VAT).

UPDATE invoices i
SET
  billing_period = COALESCE(i.billing_period, s.billing_period),
  amount_net_cents = CASE
    WHEN COALESCE(i.billing_period, s.billing_period) = 'monthly' AND s.plan = 'starter' THEN 999
    WHEN COALESCE(i.billing_period, s.billing_period) = 'yearly' AND s.plan = 'starter' THEN 9900
    WHEN COALESCE(i.billing_period, s.billing_period) = 'monthly' AND s.plan = 'pro' THEN 1999
    WHEN COALESCE(i.billing_period, s.billing_period) = 'yearly' AND s.plan = 'pro' THEN 19900
    ELSE amount_net_cents
  END,
  amount_tax_cents = CASE
    WHEN COALESCE(i.billing_period, s.billing_period) = 'monthly' AND s.plan = 'starter' THEN 190
    WHEN COALESCE(i.billing_period, s.billing_period) = 'yearly' AND s.plan = 'starter' THEN 1881
    WHEN COALESCE(i.billing_period, s.billing_period) = 'monthly' AND s.plan = 'pro' THEN 380
    WHEN COALESCE(i.billing_period, s.billing_period) = 'yearly' AND s.plan = 'pro' THEN 3781
    ELSE amount_tax_cents
  END,
  amount_gross_cents = CASE
    WHEN COALESCE(i.billing_period, s.billing_period) = 'monthly' AND s.plan = 'starter' THEN 1189
    WHEN COALESCE(i.billing_period, s.billing_period) = 'yearly' AND s.plan = 'starter' THEN 11781
    WHEN COALESCE(i.billing_period, s.billing_period) = 'monthly' AND s.plan = 'pro' THEN 2379
    WHEN COALESCE(i.billing_period, s.billing_period) = 'yearly' AND s.plan = 'pro' THEN 23681
    ELSE amount_gross_cents
  END,
  amount_cents = CASE
    WHEN COALESCE(i.billing_period, s.billing_period) = 'monthly' AND s.plan = 'starter' THEN 1189
    WHEN COALESCE(i.billing_period, s.billing_period) = 'yearly' AND s.plan = 'starter' THEN 11781
    WHEN COALESCE(i.billing_period, s.billing_period) = 'monthly' AND s.plan = 'pro' THEN 2379
    WHEN COALESCE(i.billing_period, s.billing_period) = 'yearly' AND s.plan = 'pro' THEN 23681
    ELSE amount_cents
  END
FROM subscriptions s
WHERE i.subscription_id = s.id
  AND lower(i.status) IN ('open', 'pending', 'draft')
  AND i.currency = 'EUR'
  AND lower(s.plan) IN ('starter', 'pro')
  AND COALESCE(i.billing_period, s.billing_period) IN ('monthly', 'yearly');

UPDATE subscriptions s
SET price_cents = CASE
    WHEN s.billing_period = 'monthly' AND s.plan = 'starter' THEN 1189
    WHEN s.billing_period = 'yearly' AND s.plan = 'starter' THEN 11781
    WHEN s.billing_period = 'monthly' AND s.plan = 'pro' THEN 2379
    WHEN s.billing_period = 'yearly' AND s.plan = 'pro' THEN 23681
    ELSE price_cents
  END
WHERE lower(s.status) IN ('pending', 'open')
  AND s.currency = 'EUR'
  AND lower(s.plan) IN ('starter', 'pro')
  AND s.billing_period IN ('monthly', 'yearly');
