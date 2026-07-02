-- Org-scoped business profile for Customer Portal (company, tax, fiscal, POS config).

CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES orgs(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  legal_name VARCHAR(255),
  country VARCHAR(5),
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  default_language VARCHAR(10) NOT NULL DEFAULT 'en',
  business_address_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  vat_id VARCHAR(64),
  tax_id VARCHAR(64),
  fiscal_status VARCHAR(32) NOT NULL DEFAULT 'not_required',
  fiscal_provider VARCHAR(64) NOT NULL DEFAULT 'none',
  fiscal_environment VARCHAR(32) NOT NULL DEFAULT 'not_configured',
  compliance_status VARCHAR(32) NOT NULL DEFAULT 'incomplete',
  pos_configuration_status VARCHAR(32) NOT NULL DEFAULT 'not_ready',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_org_id
  ON business_profiles(org_id);
