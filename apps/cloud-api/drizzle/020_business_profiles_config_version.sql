-- POS sync version counter (incremented on business profile changes).

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS config_version INTEGER NOT NULL DEFAULT 1;
