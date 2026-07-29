import { and, eq, isNotNull, ne, sql } from "drizzle-orm";
import { addMonths } from "date-fns";
import { db } from "../db/client.js";
import { licenses } from "../db/schema/licenses.js";
import { licenseEvents } from "../db/schema/licenseEvents.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { generateLicenseKey } from "./licenseKey.js";
import { maxLicenseValidUntil } from "./licenseGrantGuard.js";
import { maxDevicesForPlan } from "../config/licensePlans.js";

export type PaidLicensePaymentSource =
  | "portal_payment"
  | "stripe_webhook"
  | "paypal_webhook";

/**
 * After a successful Starter/Pro/Business payment: create the paid license when appropriate,
 * revoke trial licenses, and for upgrades revoke lower-tier licenses and cancel
 * old subscriptions so only one active paid license remains.
 */
export async function ensurePaidLicenseAfterSuccessfulPayment(params: {
  orgId: string;
  customerId: string;
  subscriptionId: string;
  invoiceId: string;
  source: PaidLicensePaymentSource;
  sessionId?: string;
  orderId?: string;
  /** When set, existing subscription-backed license is extended (renewals). */
  periodEnd?: Date;
}): Promise<string | undefined> {
  const {
    orgId,
    customerId,
    subscriptionId,
    invoiceId,
    source,
    sessionId,
    orderId,
    periodEnd,
  } = params;

  const cid = String(customerId).trim();
  const sid = String(subscriptionId).trim();

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id as any, sid))
    .limit(1);

  if (
    !sub ||
    (sub.plan !== "starter" && sub.plan !== "pro" && sub.plan !== "business")
  ) {
    return undefined;
  }

  const plan = sub.plan as "starter" | "pro" | "business";

  // Same tier, new subscription (e.g. monthly→yearly): end prior subscription-backed
  // paid licenses on other subscriptions. Manual grants (subscriptionId null) stay untouched.
  await db
    .update(licenses as any)
    .set({
      status: "revoked",
      updatedAt: new Date(),
      validUntil: new Date(),
    } as any)
    .where(
      and(
        eq(licenses.customerId as any, cid),
        eq(licenses.plan as any, plan),
        sql`lower(coalesce(${licenses.status}, '')) = 'active'`,
        isNotNull(licenses.subscriptionId as any),
        ne(licenses.subscriptionId as any, sid),
      ),
    );

  const [licenseForThisSub] = await db
    .select()
    .from(licenses)
    .where(
      and(
        eq(licenses.customerId as any, cid),
        eq(licenses.subscriptionId as any, sid),
        ne(licenses.plan as any, "trial"),
        sql`lower(coalesce(${licenses.status}, '')) = 'active'`,
      ),
    )
    .limit(1);

  if (licenseForThisSub) {
    if (periodEnd) {
      const newUntil = maxLicenseValidUntil(
        licenseForThisSub.validUntil as Date | null,
        periodEnd,
      );
      await db
        .update(licenses as any)
        .set({ validUntil: newUntil, updatedAt: new Date() } as any)
        .where(eq(licenses.id, licenseForThisSub.id));
    }
    return licenseForThisSub.id;
  }

  if (plan === "pro" || plan === "business") {
    // Revoke subscription-backed lower tiers — never touch manual apology grants.
    const lowerPlans =
      plan === "business"
        ? sql`lower(${licenses.plan}) in ('starter', 'pro')`
        : sql`lower(${licenses.plan}) = 'starter'`;
    await db
      .update(licenses as any)
      .set({ status: "revoked" } as any)
      .where(
        and(
          eq(licenses.customerId as any, cid),
          lowerPlans,
          sql`lower(coalesce(${licenses.status}, '')) = 'active'`,
          isNotNull(licenses.subscriptionId as any),
        ),
      );

    const lowerSubPlans =
      plan === "business"
        ? sql`lower(${subscriptions.plan}) in ('starter', 'pro')`
        : sql`lower(${subscriptions.plan}) = 'starter'`;
    await db
      .update(subscriptions as any)
      .set({ status: "cancelled", canceledAt: new Date() } as any)
      .where(
        and(
          eq(subscriptions.customerId as any, cid as any),
          lowerSubPlans,
          eq(subscriptions.status as any, "active"),
          ne(subscriptions.id as any, sid as any),
        ),
      );
  }

  // Manual licenses (subscriptionId null) must NOT block creating the subscription-backed paid license.
  const [existingSubscriptionBackedPaid] = await db
    .select()
    .from(licenses)
    .where(
      and(
        eq(licenses.customerId as any, cid),
        ne(licenses.plan as any, "trial"),
        sql`lower(coalesce(${licenses.status}, '')) = 'active'`,
        isNotNull(licenses.subscriptionId as any),
      ),
    )
    .limit(1);

  if (existingSubscriptionBackedPaid) {
    return undefined;
  }

  const now = new Date();
  const licenseKey = generateLicenseKey("CSTY");
  const validUntil =
    periodEnd ??
    (sub.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd as Date)
      : addMonths(now, 1));

  const [createdLicense] = await db
    .insert(licenses)
    .values({
      orgId: String(orgId),
      customerId: cid,
      subscriptionId: sid,
      plan,
      status: "active",
      key: licenseKey,
      maxDevices: maxDevicesForPlan(plan),
      validFrom: now,
      validUntil,
    } as any)
    .returning();

  if (!createdLicense) {
    return undefined;
  }

  await db
    .update(subscriptions as any)
    .set({
      status: "cancelled",
      canceledAt: new Date(),
      cancelAtPeriodEnd: 0,
    } as any)
    .where(
      and(
        eq(subscriptions.customerId as any, cid as any),
        eq(subscriptions.plan as any, plan),
        eq(subscriptions.status as any, "active"),
        ne(subscriptions.id as any, sid as any),
      ),
    );

  const metadata: Record<string, unknown> = {
    source,
    invoiceId: String(invoiceId),
    subscriptionId: sid,
  };
  if (sessionId) metadata.sessionId = sessionId;
  if (orderId) metadata.orderId = orderId;

  await db.insert(licenseEvents).values({
    orgId: String(orgId),
    licenseId: createdLicense.id,
    type: "created",
    metadata,
  } as any);

  await db
    .update(licenses as any)
    .set({ status: "revoked" } as any)
    .where(
      and(
        eq(licenses.customerId as any, cid),
        eq(licenses.plan as any, "trial"),
        sql`lower(coalesce(${licenses.status}, '')) = 'active'`,
      ),
    );

  return createdLicense.id;
}
