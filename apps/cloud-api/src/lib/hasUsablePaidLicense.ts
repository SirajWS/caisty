import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { licenses } from "../db/schema/licenses.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import type { Currency } from "../config/pricing.js";
import { inferPaidBillingPeriodFromPriceCents } from "./inferPaidBillingPeriodFromPriceCents.js";

/**
 * Highest active paid tier for the customer: `pro` if any active Pro license exists,
 * else `starter`, else null. Ignores expired licenses (validUntil in the past).
 */
export async function getActivePaidLicenseTierForCustomer(
  customerId: string,
): Promise<"starter" | "pro" | null> {
  const now = new Date();
  const cid = customerId.trim();
  const rows = await db
    .select({ plan: licenses.plan })
    .from(licenses)
    .where(
      and(
        eq(licenses.customerId, cid),
        sql`lower(coalesce(${licenses.status}, '')) = 'active'`,
        sql`lower(${licenses.plan}) in ('starter', 'pro')`,
        or(isNull(licenses.validUntil), gt(licenses.validUntil, now)),
      ),
    );

  if (rows.some((r) => String(r.plan ?? "").toLowerCase() === "pro")) {
    return "pro";
  }
  if (rows.some((r) => String(r.plan ?? "").toLowerCase() === "starter")) {
    return "starter";
  }
  return null;
}

/**
 * True when the customer has a Starter/Pro license that is still valid for checkout
 * (status active, not past validUntil). Trial does not block paid checkout.
 * Plan/status matching is case-insensitive for robustness with legacy rows.
 */
export async function hasUsablePaidLicenseForCustomer(
  customerId: string,
): Promise<boolean> {
  const tier = await getActivePaidLicenseTierForCustomer(customerId);
  return tier !== null;
}

/**
 * Active Starter/Pro subscription row (DB) for billing-period inference.
 * If none, checkout should fall back to license tier only (`period: null`).
 */
export async function getActivePaidSubscriptionPlanPeriodForCustomer(
  customerId: string,
): Promise<{ tier: "starter" | "pro"; period: "monthly" | "yearly" } | null> {
  const cid = customerId.trim();
  const [row] = await db
    .select({
      plan: subscriptions.plan,
      priceCents: subscriptions.priceCents,
      currency: subscriptions.currency,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.customerId as any, cid as any),
        eq(subscriptions.status as any, "active"),
        or(
          eq(subscriptions.plan as any, "starter"),
          eq(subscriptions.plan as any, "pro"),
        ),
      ),
    )
    .orderBy(desc(subscriptions.startedAt))
    .limit(1);

  if (!row?.plan) return null;
  const p = String(row.plan).toLowerCase();
  if (p !== "starter" && p !== "pro") return null;
  const curRaw = (row.currency || "EUR").toString().toUpperCase();
  const currency: Currency = curRaw === "TND" ? "TND" : "EUR";
  const inferred = inferPaidBillingPeriodFromPriceCents(
    p as "starter" | "pro",
    currency,
    Number(row.priceCents ?? 0),
  );
  return {
    tier: p as "starter" | "pro",
    period: inferred ?? "monthly",
  };
}
