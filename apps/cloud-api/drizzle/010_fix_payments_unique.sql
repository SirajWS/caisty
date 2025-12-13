-- 010_fix_payments_unique.sql
-- Fix duplicate provider_payment_id rows before enforcing uniqueness

-- 1) Ensure provider_env is set (safe)
UPDATE payments
SET provider_env = COALESCE(provider_env, 'test')
WHERE provider_env IS NULL;

-- 2) Remove duplicates (keep oldest per provider/env/payment_id)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY provider, provider_env, provider_payment_id
           ORDER BY created_at ASC NULLS LAST, id ASC
         ) AS rn
  FROM payments
  WHERE provider_payment_id IS NOT NULL
)
DELETE FROM payments
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 3) Create unique index if missing
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_env_payment_id
ON payments (provider, provider_env, provider_payment_id);
