// apps/cloud-api/src/scripts/addCustomerProfileColumn.ts
import { db } from "../db/client";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log('Adding "profile" column to "customers" (if missing)...');

    await db.execute(sql`
      ALTER TABLE "customers"
      ADD COLUMN IF NOT EXISTS "profile" jsonb NOT NULL DEFAULT '{}'::jsonb;
    `);

    console.log('Done. Column "profile" should now exist.');
  } catch (err) {
    console.error("Failed to add profile column:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
