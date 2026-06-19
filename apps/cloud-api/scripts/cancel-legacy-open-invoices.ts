/**
 * Cancel abandoned open EUR invoices with pre–VAT-inclusive additive amounts.
 * Safe to run locally; review before production.
 */
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "../src/db/client.js";
import { invoices } from "../src/db/schema/invoices.js";

const LEGACY_OPEN_GROSS_CENTS = [
  1189, 11781, 2379, 23681, // old net catalog + VAT
  1784, 17731, 2974, 35581, // new gross catalog + VAT on top
];

async function main() {
  const updated = await db
    .update(invoices)
    .set({ status: "canceled", dueAt: null } as any)
    .where(
      and(
        eq(invoices.status as any, "open"),
        eq(invoices.currency as any, "EUR"),
        or(
          ...LEGACY_OPEN_GROSS_CENTS.map((c) =>
            eq(invoices.amountGrossCents as any, c),
          ),
          ...LEGACY_OPEN_GROSS_CENTS.map((c) =>
            eq(invoices.amountCents as any, c),
          ),
        ),
      ),
    )
    .returning({ id: invoices.id, number: invoices.number });

  console.log(`Canceled ${updated.length} legacy open invoice(s):`);
  for (const row of updated) {
    console.log(`  ${row.number} (${row.id})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
