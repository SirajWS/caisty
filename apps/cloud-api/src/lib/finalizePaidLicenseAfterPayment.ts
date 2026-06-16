import { and, eq, ne, sql } from "drizzle-orm";
import { addMonths } from "date-fns";
import { db } from "../db/client.js";
import { licenses } from "../db/schema/licenses.js";
import { licenseEvents } from "../db/schema/licenseEvents.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { generateLicenseKey } from "./licenseKey.js";

export type PaidLicensePaymentSource =
  | "portal_payment"
  | "stripe_webhook"
  | "paypal_webhook";

/**
 * After a successful Starter/Pro payment: create the paid license when appropriate,
 * revoke trial licenses, and for Pro upgrades revoke Starter licenses and cancel
 * old Starter subscriptions so only one active paid license remains.
 */
export async function ensurePaidLicenseAfterSuccessfulPayment(params: {
  orgId: string;
  customerId: string;
  subscriptionId: string;
  invoiceId: string;
  source: PaidLicensePaymentSource;
  sessionId?: string;
  orderId?: string;
}): Promise<string | undefined> {
  const {
    orgId,
    customerId,
    subscriptionId,
    invoiceId,
    source,
    sessionId,
    orderId,
  } = params;

  const cid = String(customerId).trim();
  const sid = String(subscriptionId).trim();

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id as any, sid))
    .limit(1);

  if (!sub || (sub.plan !== "starter" && sub.plan !== "pro")) {
    return undefined;
  }

  const plan = sub.plan as "starter" | "pro";

  // Same tier, new subscription (e.g. monthly→yearly): end prior paid licenses on other subscriptions.
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
    return licenseForThisSub.id;
  }

  if (plan === "pro") {
    await db
      .update(licenses as any)
      .set({ status: "revoked" } as any)
      .where(
        and(
          eq(licenses.customerId as any, cid),
          sql`lower(${licenses.plan}) = 'starter'`,
          sql`lower(coalesce(${licenses.status}, '')) = 'active'`,
        ),
      );

    await db
      .update(subscriptions as any)
      .set({ status: "cancelled", canceledAt: new Date() } as any)
      .where(
        and(
          eq(subscriptions.customerId as any, cid as any),
          sql`lower(${subscriptions.plan}) = 'starter'`,
          eq(subscriptions.status as any, "active"),
          ne(subscriptions.id as any, sid as any),
        ),
      );
  }

  const [existingPaidAny] = await db
    .select()
    .from(licenses)
    .where(
      and(
        eq(licenses.customerId as any, cid),
        ne(licenses.plan as any, "trial"),
        sql`lower(coalesce(${licenses.status}, '')) = 'active'`,
      ),
    )
    .limit(1);

  if (existingPaidAny) {
    return undefined;
  }

  const now = new Date();
  const licenseKey = generateLicenseKey("CSTY");
  const validUntil = sub.currentPeriodEnd ?? addMonths(now, 1);

  const [createdLicense] = await db
    .insert(licenses)
    .values({
      orgId: String(orgId),
      customerId: cid,
      subscriptionId: sid,
      plan,
      status: "active",
      key: licenseKey,
      maxDevices: plan === "starter" ? 1 : 3,
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
