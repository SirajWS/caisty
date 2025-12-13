-- apps/cloud-api/drizzle/0005_add_customer_profile.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'customers'
      AND column_name = 'profile'
  ) THEN
    ALTER TABLE "customers"
      ADD COLUMN "profile" jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;
