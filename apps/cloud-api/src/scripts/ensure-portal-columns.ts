// apps/cloud-api/scripts/ensure-portal-columns.ts
import "dotenv/config";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL ist nicht gesetzt. Bitte .env in apps/cloud-api prüfen."
    );
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });

  try {
    console.log("Verbunden mit DB, stelle Spalten in customers sicher...");

    // 1) password_hash (nullable reicht)
    await sql/* sql */`
      ALTER TABLE "customers"
      ADD COLUMN IF NOT EXISTS "password_hash" text;
    `;

    // 2) portal_status mit Default 'active'
    await sql/* sql */`
      ALTER TABLE "customers"
      ADD COLUMN IF NOT EXISTS "portal_status" text NOT NULL DEFAULT 'active';
    `;

    console.log(
      'Fertig: Spalten "password_hash" und "portal_status" existieren jetzt.'
    );
  } catch (err) {
    console.error("Fehler beim Ausführen des ALTER TABLE:", err);
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main();
