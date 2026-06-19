/**
 * Print Stripe price env → price ID prefix mapping (no secrets).
 * Run: npx tsx scripts/debug-stripe-price-mapping.ts
 */
import { describeStripePriceSelection } from "../src/config/stripePrices.js";

const planIds = [
  "starter_monthly",
  "starter_yearly",
  "pro_monthly",
  "pro_yearly",
] as const;

console.log("Stripe price mapping (EUR, prefix only):\n");

for (const planId of planIds) {
  const parts = planId.split("_") as ["starter" | "pro", "monthly" | "yearly"];
  const [plan, billingPeriod] = parts;
  const row = describeStripePriceSelection({
    planId,
    plan,
    billingPeriod,
    currency: "EUR",
  });
  console.log(
    `${planId.padEnd(16)} → env ${row.envVarName.padEnd(40)} price ${row.priceIdPrefix}`,
  );
}
