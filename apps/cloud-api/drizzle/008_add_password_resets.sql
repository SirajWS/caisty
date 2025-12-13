-- Migration: Add portal_password_resets table for password reset functionality
-- Created: 2025-01-03

CREATE TABLE IF NOT EXISTS portal_password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index für schnelle Suche nach Token-Hash
CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash
  ON portal_password_resets(token_hash);

-- Index für Cleanup-Abfragen (abgelaufene, nicht verwendete Tokens)
CREATE INDEX IF NOT EXISTS idx_password_resets_customer_expires
  ON portal_password_resets(customer_id, expires_at, used_at);

