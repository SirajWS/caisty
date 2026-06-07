import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { licenses } from "../db/schema/licenses.js";

/**
 * True when the customer has a Starter/Pro license that is still valid for checkout
 * (status active, not past validUntil). Trial does not block paid checkout.
 * Plan/status matching is case-insensitive for robustness with legacy rows.
 */
export async function hasUsablePaidLicenseForCustomer(
  customerId: string,
): Promise<boolean> {
  const now = new Date();
  const cid = customerId.trim();
  const rows = await db
    .select({ id: licenses.id })
    .from(licenses)
    .where(
      and(
        eq(licenses.customerId, cid),
        sql`lower(coalesce(${licenses.status}, '')) = 'active'`,
        sql`lower(${licenses.plan}) in ('starter', 'pro')`,
        or(isNull(licenses.validUntil), gt(licenses.validUntil, now)),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
