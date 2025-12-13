-- Migration: Add customer_auth_providers table for Google OAuth
-- Created: 2025-01-03

CREATE TABLE IF NOT EXISTS customer_auth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'password' | 'google'
  provider_user_id TEXT,  -- bei Google: sub (Subject ID)
  provider_email TEXT,     -- E-Mail vom Provider
  provider_data TEXT,      -- JSON als String (z.B. Google Profile Picture)
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Eindeutiger Index: Ein Provider-User kann nur einmal verknüpft sein
CREATE UNIQUE INDEX IF NOT EXISTS uniq_provider_user
  ON customer_auth_providers(provider, provider_user_id);

-- Index für schnelle Suche nach Customer
CREATE INDEX IF NOT EXISTS idx_customer_auth_providers_customer_id
  ON customer_auth_providers(customer_id);

