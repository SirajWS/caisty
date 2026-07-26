/**
 * Idempotent reconciliation: pull a paid Stripe invoice (read-only API) into Caisty.
 * Never charges, never creates Stripe subscriptions.
 */

import { and, eq } from "drizzle-orm";

import { ENV } from "../config/env.js";
import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { invoices } from "../db/schema/invoices.js";
import { licenses } from "../db/schema/licenses.js";
import { payments } from "../db/schema/payments.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import {
  isManualOrNonSubscriptionLicense,
  isSubscriptionBackedPaidLicense,
  maxLicenseValidUntil,
} from "./licenseGrantGuard.js";
import {
  processStripePaidInvoice,
  resolveLocalSubscriptionForStripeInvoice,
  type ProcessStripePaidInvoiceResult,
} from "./processStripePaidInvoice.js";

export type ReconcileStripePaidInvoiceDryRun = {
  dryRun: true;
  stripeInvoiceId: string;
  stripeStatus: string | null;
  amountPaidCents: number;
  currency: string;
  livemode: boolean;
  customer: {
    localId: string | null;
    email: string | null;
    stripeCustomerId: string | null;
  };
  subscription: {
    localId: string | null;
    providerSubscriptionId: string | null;
    plan: string | null;
    currentPeriodEnd: string | null;
  };
  localPaymentExists: boolean;
  localInvoiceExists: boolean;
  paidSubscriptionLicenses: Array<{
    id: string;
    subscriptionId: string | null;
    validUntil: string | null;
  }>;
  manualLicenses: Array<{
    id: string;
    subscriptionId: string | null;
    validUntil: string | null;
    plan: string | null;
  }>;
  plannedChanges: string[];
  blockers: string[];
};

export type ReconcileStripePaidInvoiceResult =
  | ReconcileStripePaidInvoiceDryRun
  | {
      dryRun: false;
      stripeInvoiceId: string;
      applied: ProcessStripePaidInvoiceResult;
    };

function stripeSecretKey(): string {
  return ENV.STRIPE_ENV === "live"
    ? ENV.STRIPE_SECRET_KEY_LIVE
    : ENV.STRIPE_SECRET_KEY_TEST;
}

export async function fetchStripeInvoiceById(
  stripeInvoiceId: string,
): Promise<Record<string, unknown>> {
  const id = stripeInvoiceId.trim();
  if (!id.startsWith("in_")) {
    throw new Error("stripeInvoiceId must start with in_");
  }
  const key = stripeSecretKey();
  if (!key) {
    throw new Error("Stripe secret key not configured for current STRIPE_ENV");
  }
  const res = await fetch(`https://api.stripe.com/v1/invoices/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe invoice fetch failed: ${res.status} ${text}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

export async function reconcileStripePaidInvoice(params: {
  stripeInvoiceId: string;
  dryRun?: boolean;
}): Promise<ReconcileStripePaidInvoiceResult> {
  const invoice = await fetchStripeInvoiceById(params.stripeInvoiceId);
  const stripeInvoiceId = String(invoice.id || params.stripeInvoiceId);
  const amountPaidCents = Number(invoice.amount_paid ?? 0);
  const currency = String(invoice.currency || "eur").toUpperCase();
  const livemode = Boolean(invoice.livemode);
  const providerEnv = livemode ? "live" : "test";
  const status = String(invoice.status || "");

  if (params.dryRun !== false) {
    const blockers: string[] = [];
    const plannedChanges: string[] = [];

    if (status !== "paid") {
      blockers.push(`Stripe invoice status is "${status}", expected paid`);
    }

    // Resolve only — never persist provider_subscription_id backfill in dry-run.
    const resolved = await resolveLocalSubscriptionForStripeInvoice({
      subscription: invoice.subscription,
      customer: invoice.customer,
      metadata: (invoice.metadata as Record<string, string> | null) ?? null,
      livemode,
    });
    if (resolved.ok && resolved.backfillProviderSubscriptionId) {
      plannedChanges.push(
        `would backfill provider_subscription_id=${resolved.backfillProviderSubscriptionId}`,
      );
    }

    let localCustomer: {
      localId: string | null;
      email: string | null;
      stripeCustomerId: string | null;
    } = { localId: null, email: null, stripeCustomerId: null };

    let subInfo: {
      localId: string | null;
      providerSubscriptionId: string | null;
      plan: string | null;
      currentPeriodEnd: string | null;
    } = {
      localId: null,
      providerSubscriptionId: null,
      plan: null,
      currentPeriodEnd: null,
    };

    if (!resolved.ok) {
      blockers.push(resolved.message);
    } else {
      subInfo = {
        localId: String(resolved.sub.id),
        providerSubscriptionId: resolved.sub.providerSubscriptionId
          ? String(resolved.sub.providerSubscriptionId)
          : null,
        plan: String(resolved.sub.plan),
        currentPeriodEnd: resolved.sub.currentPeriodEnd
          ? new Date(resolved.sub.currentPeriodEnd as Date).toISOString()
          : null,
      };
      const [cust] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, resolved.sub.customerId))
        .limit(1);
      if (cust) {
        localCustomer = {
          localId: String(cust.id),
          email: cust.email,
          stripeCustomerId: cust.stripeCustomerId
            ? String(cust.stripeCustomerId)
            : null,
        };
      }
    }

    const [localPay] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.provider as any, "stripe"),
          eq(payments.providerEnv as any, providerEnv),
          eq(payments.providerPaymentId as any, stripeInvoiceId),
        ),
      )
      .limit(1);

    const [localInv] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(
        and(
          eq(invoices.provider as any, "stripe"),
          eq(invoices.providerEnv as any, providerEnv),
          eq(invoices.providerInvoiceId as any, stripeInvoiceId),
        ),
      )
      .limit(1);

    const cid = localCustomer.localId;
    const allLicenses = cid
      ? await db
          .select()
          .from(licenses)
          .where(eq(licenses.customerId as any, cid))
      : [];

    const paidSubscriptionLicenses = allLicenses
      .filter(isSubscriptionBackedPaidLicense)
      .map((lic) => ({
        id: String(lic.id),
        subscriptionId: lic.subscriptionId ? String(lic.subscriptionId) : null,
        validUntil: lic.validUntil
          ? new Date(lic.validUntil as Date).toISOString()
          : null,
      }));

    const manualLicenses = allLicenses
      .filter(isManualOrNonSubscriptionLicense)
      .map((lic) => ({
        id: String(lic.id),
        subscriptionId: lic.subscriptionId ? String(lic.subscriptionId) : null,
        validUntil: lic.validUntil
          ? new Date(lic.validUntil as Date).toISOString()
          : null,
        plan: lic.plan ? String(lic.plan) : null,
      }));

    if (!localPay) plannedChanges.push("create payment row (providerPaymentId=stripe invoice id)");
    else plannedChanges.push("payment already exists — skip insert");

    if (!localInv) plannedChanges.push("create paid local invoice");
    else plannedChanges.push("invoice already exists — ensure paid status");

    plannedChanges.push("update subscription period/status from Stripe invoice");
    plannedChanges.push(
      "extend subscription-backed paid license validUntil (manual licenses untouched)",
    );

    for (const m of manualLicenses) {
      plannedChanges.push(`leave manual license ${m.id} unchanged`);
    }

    return {
      dryRun: true,
      stripeInvoiceId,
      stripeStatus: status,
      amountPaidCents,
      currency,
      livemode,
      customer: localCustomer,
      subscription: subInfo,
      localPaymentExists: Boolean(localPay),
      localInvoiceExists: Boolean(localInv),
      paidSubscriptionLicenses,
      manualLicenses,
      plannedChanges,
      blockers,
    };
  }

  if (status !== "paid") {
    return {
      dryRun: false,
      stripeInvoiceId,
      applied: {
        success: false,
        code: "invalid_invoice",
        message: `Stripe invoice status is "${status}", expected paid`,
      },
    };
  }

  const applied = await processStripePaidInvoice({
    invoice,
    source: "reconcile",
  });

  return {
    dryRun: false,
    stripeInvoiceId,
    applied,
  };
}
