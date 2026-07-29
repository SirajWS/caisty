import { catalogNetTaxGrossCents } from "../src/lib/vatAmountBreakdown.js";
import { portalInvoiceDisplayBreakdown } from "../src/lib/portalInvoiceDisplayAmount.js";

const expected = {
  starter_monthly: { gross: 1499, net: 1260, tax: 239 },
  pro_monthly: { gross: 2499, net: 2100, tax: 399 },
  business_monthly: { gross: 3499, net: 2940, tax: 559 },
  starter_yearly: { gross: 14900, net: 12521, tax: 2379 },
  pro_yearly: { gross: 29900, net: 25126, tax: 4774 },
  business_yearly: { gross: 34900, net: 29328, tax: 5572 },
} as const;

let ok = true;

for (const [key, exp] of Object.entries(expected)) {
  const [plan, period] = key.split("_") as [
    "starter" | "pro" | "business",
    "monthly" | "yearly",
  ];
  const cat = catalogNetTaxGrossCents(plan, "EUR", period);
  const match =
    cat.grossCents === exp.gross &&
    cat.netCents === exp.net &&
    cat.taxCents === exp.tax;
  console.log(`${key}:`, cat, match ? "OK" : `EXPECTED ${JSON.stringify(exp)}`);
  if (!match) ok = false;
}

const legacy = portalInvoiceDisplayBreakdown(
  {
    status: "open",
    amountCents: 1784,
    amountGrossCents: 1784,
    amountNetCents: 1499,
    amountTaxCents: 285,
    planName: "Starter",
    billingPeriod: "monthly",
    provider: "stripe",
    currency: "EUR",
  },
  "starter",
  "monthly",
);

console.log("legacy starter_monthly display:", legacy);
if (legacy.grossCents !== 1499 || legacy.netCents !== 1260 || legacy.taxCents !== 239) {
  ok = false;
  console.error("LEGACY DISPLAY FAILED (1784 pattern)");
}

const oldLegacy = portalInvoiceDisplayBreakdown(
  {
    status: "paid",
    amountCents: 1189,
    amountGrossCents: 1189,
    amountNetCents: 999,
    amountTaxCents: 190,
    planName: "Starter",
    billingPeriod: "monthly",
    provider: "stripe",
    currency: "EUR",
  },
  "starter",
  "monthly",
);

console.log("old legacy starter_monthly display:", oldLegacy);
if (
  oldLegacy.grossCents !== 1499 ||
  oldLegacy.netCents !== 1260 ||
  oldLegacy.taxCents !== 239
) {
  ok = false;
  console.error("LEGACY DISPLAY FAILED (1189 pattern)");
}

process.exit(ok ? 0 : 1);
