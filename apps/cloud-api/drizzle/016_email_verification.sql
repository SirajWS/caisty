-- Email verification for portal customers (signup confirm before login).
-- Existing accounts are backfilled as verified so they are not locked out.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS portal_email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token_hash
  ON portal_email_verifications(token_hash);

CREATE INDEX IF NOT EXISTS idx_email_verifications_customer_expires
  ON portal_email_verifications(customer_id, expires_at, used_at);

-- Treat all existing portal customers as already verified (password or Google signup).
UPDATE customers c
SET email_verified_at = COALESCE(c.email_verified_at, c.created_at)
WHERE c.email_verified_at IS NULL
  AND (
    c.password_hash IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM customer_auth_providers cap
      WHERE cap.customer_id = c.id AND cap.provider = 'google'
    )
  );
