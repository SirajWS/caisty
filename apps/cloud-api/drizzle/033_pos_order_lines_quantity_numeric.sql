-- B4.0: store POS fractional quantities exactly (numeric 12,3).
-- Existing integer quantities are preserved via USING quantity::numeric.
-- Idempotent: skip the type change when quantity is already numeric(12,3).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pos_order_lines'
      AND column_name = 'quantity'
      AND (
        data_type <> 'numeric'
        OR numeric_precision IS DISTINCT FROM 12
        OR numeric_scale IS DISTINCT FROM 3
      )
  ) THEN
    ALTER TABLE pos_order_lines
      ALTER COLUMN quantity TYPE NUMERIC(12, 3)
      USING quantity::numeric(12, 3);
  END IF;
END $$;

ALTER TABLE pos_order_lines
  ALTER COLUMN quantity SET DEFAULT 1;

ALTER TABLE pos_order_lines
  ALTER COLUMN quantity SET NOT NULL;
