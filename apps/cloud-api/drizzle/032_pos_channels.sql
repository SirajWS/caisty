-- Organization-scoped POS delivery / sales channels (public sync data only; no secrets).

-- Also migrates pos_sync_events idempotency to organization scope.



CREATE TABLE IF NOT EXISTS pos_channels (

  id UUID NOT NULL,

  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  source_device_id UUID REFERENCES devices(id) ON DELETE SET NULL,

  slug TEXT NOT NULL,

  name TEXT NOT NULL,

  enabled BOOLEAN NOT NULL DEFAULT true,

  provider TEXT,

  mode TEXT,

  store_id TEXT,

  status_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,

  notes TEXT,

  logo_data_url TEXT,

  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,

  deleted_at TIMESTAMPTZ,

  client_updated_at TIMESTAMPTZ NOT NULL,

  sync_batch_id UUID REFERENCES pos_sync_batches(id) ON DELETE SET NULL,

  schema_version INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (org_id, id)

);



CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_channels_org_slug_active

  ON pos_channels (org_id, slug)

  WHERE deleted_at IS NULL;



CREATE INDEX IF NOT EXISTS idx_pos_channels_org_updated_id

  ON pos_channels (org_id, updated_at ASC, id ASC);



-- Tenant-scoped sync event idempotency (replaces global sync_event_id uniqueness from 021).

-- Risk: fails if duplicate (org_id, sync_event_id) pairs already exist within one org.

DROP INDEX IF EXISTS uq_pos_sync_events_sync_event_id;



CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_sync_events_org_sync_event_id

  ON pos_sync_events (org_id, sync_event_id);

