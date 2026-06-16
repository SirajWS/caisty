/**
 * Stripe Tax Rate for DE VAT 19 % (exclusive — added on top of net catalog prices).
 * Prices in Stripe stay net; this rate is attached at Checkout Session creation.
 */

let cachedEuVat19TaxRateId: string | null = null;

/**
 * Resolve active Stripe Tax Rate ID for 19 % exclusive VAT (EUR checkout).
 * Order: env STRIPE_TAX_RATE_EUR_VAT_19 → existing Stripe tax rate → create once.
 */
export async function resolveStripeEuVat19TaxRateId(
  secretKey: string,
): Promise<string | null> {
  if (cachedEuVat19TaxRateId) return cachedEuVat19TaxRateId;

  const fromEnv = process.env.STRIPE_TAX_RATE_EUR_VAT_19?.trim();
  if (fromEnv) {
    cachedEuVat19TaxRateId = fromEnv;
    return fromEnv;
  }

  try {
    const listRes = await fetch(
      "https://api.stripe.com/v1/tax_rates?limit=100&active=true",
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );
    if (listRes.ok) {
      const listJson = (await listRes.json()) as {
        data?: Array<{
          id?: string;
          active?: boolean;
          percentage?: number;
          inclusive?: boolean;
        }>;
      };
      const existing = listJson.data?.find(
        (tr) =>
          tr.active &&
          tr.percentage === 19 &&
          tr.inclusive === false &&
          typeof tr.id === "string",
      );
      if (existing?.id) {
        cachedEuVat19TaxRateId = existing.id;
        return existing.id;
      }
    }

    const createParams = new URLSearchParams({
      display_name: "Umsatzsteuer",
      description: "Deutschland USt. 19 %",
      percentage: "19",
      inclusive: "false",
      jurisdiction: "DE",
    });
    const createRes = await fetch("https://api.stripe.com/v1/tax_rates", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: createParams.toString(),
    });
    if (!createRes.ok) {
      console.warn(
        "[stripeTaxRates] Could not create DE VAT 19% tax rate:",
        await createRes.text(),
      );
      return null;
    }
    const created = (await createRes.json()) as { id?: string };
    if (created.id) {
      cachedEuVat19TaxRateId = created.id;
      console.info(
        `[stripeTaxRates] Created Stripe tax rate ${created.id} (19% exclusive). ` +
          "Set STRIPE_TAX_RATE_EUR_VAT_19 in .env to reuse.",
      );
      return created.id;
    }
  } catch (err) {
    console.warn("[stripeTaxRates] resolveStripeEuVat19TaxRateId failed:", err);
  }

  return null;
}
