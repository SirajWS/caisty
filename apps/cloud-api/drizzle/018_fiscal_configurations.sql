-- Org-scoped fiscal configuration (API-service providers, cloud profile — not downloadable packages).

CREATE TABLE IF NOT EXISTS fiscal_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES orgs(id) ON DELETE CASCADE,
  country VARCHAR(5),
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  fiscal_required BOOLEAN NOT NULL DEFAULT false,
  provider VARCHAR(32) NOT NULL DEFAULT 'none',
  provider_type VARCHAR(32) NOT NULL DEFAULT 'none',
  provider_name VARCHAR(128),
  fiscal_status VARCHAR(32) NOT NULL DEFAULT 'not_required',
  fiscal_environment VARCHAR(32) NOT NULL DEFAULT 'not_configured',
  receipt_mode VARCHAR(32) NOT NULL DEFAULT 'standard',
  fiscal_profile_key VARCHAR(64) NOT NULL DEFAULT 'generic_standard',
  supported_exports_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  pos_download_allowed BOOLEAN NOT NULL DEFAULT true,
  pos_configuration_status VARCHAR(32) NOT NULL DEFAULT 'not_ready',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_configurations_org_id
  ON fiscal_configurations(org_id);

CREATE INDEX IF NOT EXISTS idx_fiscal_configurations_country
  ON fiscal_configurations(country);

CREATE INDEX IF NOT EXISTS idx_fiscal_configurations_provider
  ON fiscal_configurations(provider);
