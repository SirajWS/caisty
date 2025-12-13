-- 009_payment_architecture.sql

-- 1) NEW TABLES

CREATE TABLE IF NOT EXISTS billing_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  email text,
  provider varchar(20) NOT NULL,
  provider_env varchar(10) NOT NULL,
  provider_customer_id text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_customers_provider_env_customer
  ON billing_customers (provider, provider_env, provider_customer_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_customers_org_provider_env
  ON billing_customers (org_id, provider, provider_env);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_amount_net_cents integer NOT NULL DEFAULT 0,
  amount_net_cents integer NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  amount_tax_cents integer NOT NULL DEFAULT 0,
  amount_gross_cents integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id
  ON invoice_lines (invoice_id);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  key text NOT NULL,
  scope text NOT NULL,
  request_hash text NOT NULL,
  response_json text,
  created_at timestamp NOT NULL DEFAULT now(),
  expires_at timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_idempotency_keys_key
  ON idempotency_keys (key);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_org_scope
  ON idempotency_keys (org_id, scope);

-- 2) EXTEND subscriptions

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS provider varchar(20),
  ADD COLUMN IF NOT EXISTS provider_env varchar(10),
  ADD COLUMN IF NOT EXISTS provider_customer_id text,
  ADD COLUMN IF NOT EXISTS provider_subscription_id text,
  ADD COLUMN IF NOT EXISTS current_period_start timestamp,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS canceled_at timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_provider_env_sub_id
  ON subscriptions (provider, provider_env, provider_subscription_id);

-- Backfill existing subs as paypal/test (safe for dev)
UPDATE subscriptions
SET provider = COALESCE(provider, 'paypal'),
    provider_env = COALESCE(provider_env, 'test')
WHERE provider IS NULL OR provider_env IS NULL;

-- 3) EXTEND payments

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS provider_env varchar(10),
  ADD COLUMN IF NOT EXISTS amount_net_cents integer,
  ADD COLUMN IF NOT EXISTS amount_tax_cents integer,
  ADD COLUMN IF NOT EXISTS amount_gross_cents integer,
  ADD COLUMN IF NOT EXISTS failure_code text,
  ADD COLUMN IF NOT EXISTS failure_message text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_env_payment_id
  ON payments (provider, provider_env, provider_payment_id);

UPDATE payments
SET provider_env = COALESCE(provider_env, 'test')
WHERE provider_env IS NULL;

-- optional backfill split amounts from legacy amount_cents if you want:
-- UPDATE payments
-- SET amount_gross_cents = COALESCE(amount_gross_cents, amount_cents),
--     amount_net_cents = COALESCE(amount_net_cents, amount_cents),
--     amount_tax_cents = COALESCE(amount_tax_cents, 0)
-- WHERE amount_gross_cents IS NULL OR amount_net_cents IS NULL OR amount_tax_cents IS NULL;

-- 4) EXTEND invoices

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS provider varchar(20),
  ADD COLUMN IF NOT EXISTS provider_env varchar(10),
  ADD COLUMN IF NOT EXISTS provider_invoice_id text,
  ADD COLUMN IF NOT EXISTS amount_net_cents integer,
  ADD COLUMN IF NOT EXISTS amount_tax_cents integer,
  ADD COLUMN IF NOT EXISTS amount_gross_cents integer,
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS paid_at timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_provider_env_invoice_id
  ON invoices (provider, provider_env, provider_invoice_id);

-- 5) EXTEND webhooks (no rename yet)

ALTER TABLE webhooks
  ADD COLUMN IF NOT EXISTS provider_env varchar(10),
  ADD COLUMN IF NOT EXISTS event_id text,
  ADD COLUMN IF NOT EXISTS processed_at timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS uq_webhooks_provider_env_event_id
  ON webhooks (provider, provider_env, event_id);

UPDATE webhooks
SET provider_env = COALESCE(provider_env, 'test')
WHERE provider_env IS NULL;

