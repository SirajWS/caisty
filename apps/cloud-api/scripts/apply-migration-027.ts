import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../drizzle/027_pos_orders_provider_fields.sql",
);

const sql = postgres(process.env.DATABASE_URL!);
const migrationSql = readFileSync(migrationPath, "utf8");

console.log("Applying 027_pos_orders_provider_fields.sql …");
await sql.unsafe(migrationSql);

const rows = await sql<{ column_name: string }[]>`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'pos_orders'
  ORDER BY ordinal_position
`;

console.log("pos_orders columns after migration:");
console.log(rows.map((r) => r.column_name).join(", "));

await sql.end();
console.log("Done.");
