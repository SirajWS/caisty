-- B5: persistent write-once POS station codes (K01, K02, … K100+).
-- Receipt numbers in the new format are unique per organization.
-- Historical RYYYYMMDD-NNNN duplicates are excluded from the unique index.

CREATE TABLE IF NOT EXISTS org_station_counters (
  org_id UUID PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
  last_assigned INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS station_code VARCHAR(16);

CREATE UNIQUE INDEX IF NOT EXISTS uq_devices_org_station_code
  ON devices (org_id, station_code)
  WHERE station_code IS NOT NULL;

-- Backfill every existing device in created_at order. Does not rewrite receipts.
WITH numbered AS (
  SELECT
    id,
    org_id,
    ROW_NUMBER() OVER (PARTITION BY org_id ORDER BY created_at ASC, id ASC) AS n
  FROM devices
  WHERE station_code IS NULL
)
UPDATE devices AS d
SET station_code = 'K' || LPAD(numbered.n::text, GREATEST(2, LENGTH(numbered.n::text)), '0')
FROM numbered
WHERE d.id = numbered.id
  AND d.station_code IS NULL;

INSERT INTO org_station_counters (org_id, last_assigned)
SELECT d.org_id, MAX(CAST(SUBSTRING(d.station_code FROM 2) AS INTEGER))
FROM devices d
WHERE d.station_code IS NOT NULL
  AND d.station_code ~ '^K[0-9]{2,}$'
GROUP BY d.org_id
ON CONFLICT (org_id) DO UPDATE
SET last_assigned = GREATEST(
  org_station_counters.last_assigned,
  EXCLUDED.last_assigned
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_receipts_org_station_receipt_number
  ON pos_receipts (org_id, receipt_number)
  WHERE receipt_number ~ '^R[0-9]{8}-K[0-9]{2,}-[0-9]{4}$';

CREATE OR REPLACE FUNCTION devices_station_code_write_once()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.station_code IS NOT NULL
     AND NEW.station_code IS DISTINCT FROM OLD.station_code THEN
    RAISE EXCEPTION 'station_code is write-once and cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_devices_station_code_write_once ON devices;
CREATE TRIGGER trg_devices_station_code_write_once
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION devices_station_code_write_once();
