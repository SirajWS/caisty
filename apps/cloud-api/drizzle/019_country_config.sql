-- Global country configuration (currency, fiscal rules, receipt mode).

CREATE TABLE IF NOT EXISTS country_config (
  code VARCHAR(5) PRIMARY KEY,
  name_de VARCHAR(128) NOT NULL,
  name_en VARCHAR(128) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  allowed_currencies_json JSONB NOT NULL DEFAULT '["EUR"]'::jsonb,
  fiscal_required BOOLEAN NOT NULL DEFAULT false,
  fiscal_provider VARCHAR(64),
  receipt_mode VARCHAR(32) NOT NULL DEFAULT 'standard',
  fiscal_surcharge_cents INTEGER NOT NULL DEFAULT 0,
  pos_download_allowed BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed: values mirror pre-Phase-1 businessProfileRules.ts behavior.
INSERT INTO country_config (
  code, name_de, name_en, currency, allowed_currencies_json,
  fiscal_required, fiscal_provider, receipt_mode, fiscal_surcharge_cents,
  pos_download_allowed, status, sort_order
) VALUES
  ('DE', 'Deutschland', 'Germany', 'EUR', '["EUR"]'::jsonb,
   true, 'fiskaly', 'certified', 500, true, 'active', 1),
  ('AT', 'Österreich', 'Austria', 'EUR', '["EUR"]'::jsonb,
   true, NULL, 'standard_until_certified', 0, true, 'coming_soon', 2),
  ('FR', 'Frankreich', 'France', 'EUR', '["EUR"]'::jsonb,
   true, NULL, 'standard_until_certified', 0, true, 'coming_soon', 3),
  ('IT', 'Italien', 'Italy', 'EUR', '["EUR"]'::jsonb,
   true, NULL, 'standard_until_certified', 0, true, 'coming_soon', 4),
  ('ES', 'Spanien', 'Spain', 'EUR', '["EUR"]'::jsonb,
   true, NULL, 'standard_until_certified', 0, true, 'coming_soon', 5),
  ('PT', 'Portugal', 'Portugal', 'EUR', '["EUR"]'::jsonb,
   true, NULL, 'standard_until_certified', 0, true, 'coming_soon', 6),
  ('NL', 'Niederlande', 'Netherlands', 'EUR', '["EUR"]'::jsonb,
   true, NULL, 'standard_until_certified', 0, true, 'coming_soon', 7),
  ('BE', 'Belgien', 'Belgium', 'EUR', '["EUR"]'::jsonb,
   true, NULL, 'standard_until_certified', 0, true, 'coming_soon', 8),
  ('CH', 'Schweiz', 'Switzerland', 'CHF', '["CHF","EUR"]'::jsonb,
   false, NULL, 'standard', 0, true, 'active', 9),
  ('GB', 'Vereinigtes Königreich', 'United Kingdom', 'GBP', '["GBP"]'::jsonb,
   false, NULL, 'standard', 0, true, 'active', 10),
  ('IE', 'Irland', 'Ireland', 'EUR', '["EUR"]'::jsonb,
   false, NULL, 'standard', 0, true, 'active', 11),
  ('TN', 'Tunesien', 'Tunisia', 'TND', '["TND"]'::jsonb,
   false, NULL, 'standard', 0, true, 'active', 12),
  ('MA', 'Marokko', 'Morocco', 'MAD', '["MAD"]'::jsonb,
   false, NULL, 'standard', 0, true, 'active', 13),
  ('DZ', 'Algerien', 'Algeria', 'DZD', '["DZD"]'::jsonb,
   false, NULL, 'standard', 0, true, 'active', 14),
  ('LY', 'Libyen', 'Libya', 'LYD', '["LYD"]'::jsonb,
   false, NULL, 'standard', 0, true, 'active', 15),
  ('US', 'Vereinigte Staaten', 'United States', 'USD', '["USD"]'::jsonb,
   false, NULL, 'standard', 0, true, 'active', 16),
  ('OTHER', 'Sonstiges', 'Other', 'EUR', '["EUR"]'::jsonb,
   false, NULL, 'standard', 0, true, 'active', 17)
ON CONFLICT (code) DO NOTHING;
