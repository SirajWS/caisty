ALTER TABLE "customers"
  ADD COLUMN "password_hash" text;

ALTER TABLE "customers"
  ADD COLUMN "portal_status" text NOT NULL DEFAULT 'active';
