// apps/cloud-api/src/billing/WebhookProcessor.ts
import { db } from "../db/client.js";
import { invoices } from "../db/schema/invoices.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { payments } from "../db/schema/payments.js";
import { licenses } from "../db/schema/licenses.js";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { notificationService } from "./NotificationService.js";
import { ensurePaidLicenseAfterSuccessfulPayment } from "../lib/finalizePaidLicenseAfterPayment.js";
import {
  persistStripeSubscriptionAfterCheckoutSession,
  invoiceProviderEnvToStripeEnv,
} from "../lib/persistStripeSubscriptionFromSession.js";
import { syncPaidInvoiceFromStripeCheckoutSession, syncPaidInvoiceFromStripeInvoice } from "../lib/syncPaidInvoiceFromStripe.js";
import { parseBillingPeriodFromPlanId } from "../lib/billingPeriod.js";

export interface ProcessedWebhookResult {
  success: boolean;
  message: string;
  updatedInvoiceId?: string;
  updatedSubscriptionId?: string;
  createdPaymentId?: string;
  createdLicenseId?: string;
}

/**
 * Verarbeitet PayPal Webhook-Events und aktualisiert die DB entsprechend.
 */
export class WebhookProcessor {
  /**
   * Verarbeitet ein PayPal Webhook-Event.
   */
  async processPayPalEvent(
    eventType: string,
    eventData: any
  ): Promise<ProcessedWebhookResult> {
    switch (eventType) {
      case "CHECKOUT.ORDER.APPROVED":
      case "PAYMENT.SALE.COMPLETED":
        return this.handlePaymentCompleted(eventData);

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED":
        return this.handlePaymentFailed(eventData);

      case "BILLING.SUBSCRIPTION.CANCELLED":
        return this.handleSubscriptionCancelled(eventData);

      case "BILLING.SUBSCRIPTION.SUSPENDED":
        return this.handleSubscriptionSuspended(eventData);

      default:
        return {
          success: true,
          message: `Event type ${eventType} not processed (ignored)`,
        };
    }
  }

  /**
   * Verarbeitet erfolgreiche Zahlung (CHECKOUT.ORDER.APPROVED oder PAYMENT.SALE.COMPLETED).
   */
  private async handlePaymentCompleted(eventData: any): Promise<ProcessedWebhookResult> {
    // PayPal sendet unterschiedliche Formate je nach Event-Typ
    // CHECKOUT.ORDER.APPROVED: eventData.resource enthält Order-Details
    // PAYMENT.SALE.COMPLETED: eventData.resource enthält Sale-Details

    const resource = eventData.resource || {};
    const orderId = resource.id || resource.order_id || eventData.resource?.id;
    
    // InvoiceId aus metadata extrahieren (wurde beim Checkout in custom_id/reference_id gespeichert)
    const invoiceId = resource.custom_id || 
                      resource.reference_id || 
                      resource.purchase_units?.[0]?.custom_id ||
                      resource.purchase_units?.[0]?.reference_id;

    if (!invoiceId) {
      return {
        success: false,
        message: "Invoice ID not found in PayPal event data",
      };
    }

    // Invoice finden
    const [inv] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!inv) {
      return {
        success: false,
        message: `Invoice ${invoiceId} not found`,
      };
    }

    // Wenn bereits bezahlt, nichts tun (idempotent)
    if (inv.status === "paid") {
      return {
        success: true,
        message: `Invoice ${invoiceId} already paid`,
        updatedInvoiceId: invoiceId,
      };
    }

    // Invoice auf "paid" setzen
    await db
      .update(invoices as any)
      .set({
        status: "paid",
        paidAt: new Date(),
        dueAt: null,
        providerRef: orderId || inv.providerRef,
      } as any)
      .where(eq(invoices.id, invoiceId));

    // Subscription aktivieren, falls vorhanden
    let updatedSubscriptionId: string | undefined;
    if (inv.subscriptionId) {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, inv.subscriptionId))
        .limit(1);

      if (sub && sub.status !== "active") {
        await db
          .update(subscriptions as any)
          .set({ status: "active" } as any)
          .where(eq(subscriptions.id, inv.subscriptionId));
        updatedSubscriptionId = inv.subscriptionId;
      }
    }

    // Payment-Record erstellen
    const amountCents = resource.amount?.total ? 
      Math.round(parseFloat(resource.amount.total) * 100) : 
      inv.amountCents;

    const [payment] = await db
      .insert(payments)
      .values({
        orgId: inv.orgId,
        customerId: inv.customerId,
        subscriptionId: inv.subscriptionId || null,
        provider: "paypal",
        providerEnv: inv.providerEnv || "test",
        providerPaymentId: orderId || resource.id,
        providerStatus: "COMPLETED",
        amountCents: amountCents,
        currency: inv.currency || "EUR",
        status: "succeeded",
        amountGrossCents: amountCents,
      } as any)
      .returning();

    // Lizenz erstellen / Upgrade (Starter → Pro): gemeinsame Logik
    let createdLicenseId: string | undefined;
    if (inv.customerId && inv.orgId && inv.subscriptionId) {
      createdLicenseId = await ensurePaidLicenseAfterSuccessfulPayment({
        orgId: String(inv.orgId),
        customerId: String(inv.customerId),
        subscriptionId: String(inv.subscriptionId),
        invoiceId: String(inv.id),
        source: "paypal_webhook",
        orderId: orderId || resource.id,
      });
    }

    // Notification erstellen
    if (inv.orgId) {
      await notificationService.notifyPayPalPaymentCompleted({
        orgId: String(inv.orgId),
        customerId: inv.customerId ? String(inv.customerId) : undefined,
        invoiceId: String(inv.id),
        invoiceNumber: inv.number,
        orderId: orderId,
        amountCents: amountCents,
        currency: inv.currency || "EUR",
        licenseId: createdLicenseId,
      });
    }

    return {
      success: true,
      message: `Payment completed for invoice ${invoiceId}`,
      updatedInvoiceId: invoiceId,
      updatedSubscriptionId,
      createdPaymentId: payment?.id,
      createdLicenseId,
    };
  }

  /**
   * Verarbeitet fehlgeschlagene Zahlung.
   */
  private async handlePaymentFailed(eventData: any): Promise<ProcessedWebhookResult> {
    const resource = eventData.resource || {};
    const invoiceId = resource.custom_id || resource.reference_id;

    if (!invoiceId) {
      return {
        success: false,
        message: "Invoice ID not found in PayPal event data",
      };
    }

    // Invoice auf "open" lassen (nicht auf "failed" setzen, da Retry möglich)
    // Optional: Notification erstellen

    return {
      success: true,
      message: `Payment failed for invoice ${invoiceId} (logged)`,
      updatedInvoiceId: invoiceId,
    };
  }

  /**
   * Verarbeitet gekündigte Subscription.
   */
  private async handleSubscriptionCancelled(eventData: any): Promise<ProcessedWebhookResult> {
    const resource = eventData.resource || {};
    const subscriptionId = resource.id || resource.subscription_id;

    if (!subscriptionId) {
      // Versuche Subscription über billing_agreement_id zu finden
      const billingAgreementId = resource.billing_agreement_id;
      if (billingAgreementId) {
        // TODO: Mapping von billing_agreement_id zu subscription_id
      }
      return {
        success: false,
        message: "Subscription ID not found in PayPal event data",
      };
    }

    // Subscription in DB finden (über providerSubscriptionId)
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.providerSubscriptionId as any, subscriptionId))
      .limit(1);

    if (sub) {
      await db
        .update(subscriptions as any)
        .set({
          status: "cancelled",
          canceledAt: new Date(),
          cancelAtPeriodEnd: 0,
        } as any)
        .where(eq(subscriptions.id, sub.id));

      // Notification erstellen
      if (sub.orgId) {
        await notificationService.notifySubscriptionCancelled({
          orgId: String(sub.orgId),
          customerId: sub.customerId ? String(sub.customerId) : undefined,
          subscriptionId: String(sub.id),
          provider: "paypal",
          providerSubscriptionId: subscriptionId,
        });
      }

      return {
        success: true,
        message: `Subscription ${sub.id} cancelled`,
        updatedSubscriptionId: sub.id,
      };
    }

    return {
      success: false,
      message: `Subscription with provider ID ${subscriptionId} not found`,
    };
  }

  /**
   * Verarbeitet pausierte Subscription.
   */
  private async handleSubscriptionSuspended(eventData: any): Promise<ProcessedWebhookResult> {
    // Ähnlich wie cancelled, aber Status = "past_due" oder "suspended"
    const resource = eventData.resource || {};
    const subscriptionId = resource.id || resource.subscription_id;

    if (!subscriptionId) {
      return {
        success: false,
        message: "Subscription ID not found in PayPal event data",
      };
    }

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.providerSubscriptionId as any, subscriptionId))
      .limit(1);

    if (sub) {
      await db
        .update(subscriptions as any)
        .set({ status: "past_due" } as any)
        .where(eq(subscriptions.id, sub.id));

      return {
        success: true,
        message: `Subscription ${sub.id} suspended`,
        updatedSubscriptionId: sub.id,
      };
    }

    return {
      success: false,
      message: `Subscription with provider ID ${subscriptionId} not found`,
    };
  }

  /**
   * Verarbeitet ein Stripe Webhook-Event.
   */
  async processStripeEvent(
    eventType: string,
    eventData: any
  ): Promise<ProcessedWebhookResult> {
    const data = eventData.data?.object || eventData.object;

    switch (eventType) {
      case "checkout.session.completed":
        return this.handleStripeCheckoutCompleted(data);

      case "invoice.paid":
        return this.handleStripeInvoicePaid(data);

      case "invoice.payment_failed":
        return this.handleStripePaymentFailed(data);

      case "customer.subscription.deleted":
        return this.handleStripeSubscriptionDeleted(data);

      case "customer.subscription.updated":
        return this.handleStripeSubscriptionUpdated(data);

      default:
        return {
          success: true,
          message: `Event type ${eventType} not processed (ignored)`,
        };
    }
  }

  /**
   * Verarbeitet erfolgreiche Stripe Checkout Session.
   */
  private async handleStripeCheckoutCompleted(session: any): Promise<ProcessedWebhookResult> {
    const sessionId = session.id;
    const invoiceId = session.metadata?.invoiceId;

    if (!invoiceId) {
      return {
        success: false,
        message: "Invoice ID not found in Stripe session metadata",
      };
    }

    // Invoice finden
    const [inv] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!inv) {
      return {
        success: false,
        message: `Invoice ${invoiceId} not found`,
      };
    }

    await persistStripeSubscriptionAfterCheckoutSession({
      portalCustomerId: inv.customerId,
      internalSubscriptionId: inv.subscriptionId,
      session,
      providerEnv: invoiceProviderEnvToStripeEnv(inv.providerEnv),
    });

    await syncPaidInvoiceFromStripeCheckoutSession({
      invoiceId: String(invoiceId),
      subscriptionId: inv.subscriptionId,
      session: session as Record<string, unknown>,
      providerRef: sessionId,
      markPaid: inv.status !== "paid",
    });

    // Wenn bereits bezahlt, Beträge trotzdem von Stripe nachziehen (Legacy-Preise)
    if (inv.status === "paid") {
      return {
        success: true,
        message: `Invoice ${invoiceId} already paid (amounts synced from Stripe)`,
        updatedInvoiceId: invoiceId,
      };
    }

    // Subscription aktivieren, falls vorhanden
    let updatedSubscriptionId: string | undefined;
    if (inv.subscriptionId) {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, inv.subscriptionId))
        .limit(1);

      if (sub && sub.status !== "active") {
        await db
          .update(subscriptions as any)
          .set({ status: "active" } as any)
          .where(eq(subscriptions.id, inv.subscriptionId));
        updatedSubscriptionId = inv.subscriptionId;
      }
    }

    // Payment-Record erstellen
    const amountCents = Number(session.amount_total || inv.amountCents);

    const [payment] = await db
      .insert(payments)
      .values({
        orgId: inv.orgId,
        customerId: inv.customerId,
        subscriptionId: inv.subscriptionId || null,
        provider: "stripe",
        providerEnv: inv.providerEnv || "test",
        providerPaymentId: sessionId,
        providerStatus: "paid",
        amountCents: amountCents,
        currency: inv.currency || "EUR",
        status: "succeeded",
        amountGrossCents: amountCents,
      } as any)
      .returning();

    // Lizenz erstellen / Upgrade (Starter → Pro): gleiche Logik wie PayPal/Capture
    let createdLicenseId: string | undefined;
    if (inv.customerId && inv.orgId && inv.subscriptionId) {
      createdLicenseId = await ensurePaidLicenseAfterSuccessfulPayment({
        orgId: String(inv.orgId),
        customerId: String(inv.customerId),
        subscriptionId: String(inv.subscriptionId),
        invoiceId: String(inv.id),
        source: "stripe_webhook",
        sessionId,
      });
    }

    // Notification erstellen
    if (inv.orgId) {
      await notificationService.notifyStripePaymentCompleted({
        orgId: String(inv.orgId),
        customerId: inv.customerId ? String(inv.customerId) : undefined,
        invoiceId: String(inv.id),
        invoiceNumber: inv.number,
        sessionId: sessionId,
        amountCents: amountCents,
        currency: inv.currency || "EUR",
        licenseId: createdLicenseId,
      });
    }

    return {
      success: true,
      message: `Payment completed for invoice ${invoiceId}`,
      updatedInvoiceId: invoiceId,
      updatedSubscriptionId,
      createdPaymentId: payment?.id,
      createdLicenseId,
    };
  }

  private generateWebhookInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const rand = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");
    return `INV-${year}-${rand}`;
  }

  /**
   * Erste Zahlung nach Checkout: Session-Zahlung existiert schon → keine zweite Payment-Zeile für dieselbe Invoice.
   */
  private async hasRecentStripeCheckoutPaymentForSubscription(
    internalSubscriptionId: string,
    amountCents: number
  ): Promise<boolean> {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const [row] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.subscriptionId as any, internalSubscriptionId as any),
          eq(payments.provider as any, "stripe"),
          eq(payments.status as any, "succeeded"),
          sql`${payments.providerPaymentId} like 'cs_%'`,
          eq(payments.amountCents as any, amountCents),
          gte(payments.createdAt as any, since),
        ),
      )
      .orderBy(desc(payments.createdAt as any))
      .limit(1);
    return Boolean(row);
  }

  /**
   * Verarbeitet bezahlte Stripe Invoice (Renewal + erste Zahlung mit Metadata).
   * Idempotent bzgl. Stripe-Invoice-ID (Retries erzeugen keine Duplikate).
   */
  private async handleStripeInvoicePaid(invoice: any): Promise<ProcessedWebhookResult> {
    const stripeInvoiceId = String(invoice.id || "");
    const stripeSubRef = invoice.subscription;
    const stripeSubId =
      typeof stripeSubRef === "string"
        ? stripeSubRef
        : stripeSubRef?.id
          ? String(stripeSubRef.id)
          : "";

    const pEnvGuess = invoice.livemode ? "live" : "test";
    const periodStartSec = invoice.period_start as number | undefined;
    const periodEndSec = invoice.period_end as number | undefined;
    const periodStart =
      typeof periodStartSec === "number"
        ? new Date(periodStartSec * 1000)
        : null;
    const periodEnd =
      typeof periodEndSec === "number" ? new Date(periodEndSec * 1000) : null;

    let sub: InferSelectModel<typeof subscriptions> | undefined;

    if (stripeSubId) {
      const [row] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.provider as any, "stripe"),
            eq(subscriptions.providerSubscriptionId as any, stripeSubId),
          ),
        )
        .limit(1);
      sub = row;
    }

    const metaInvoiceId = invoice.metadata?.invoiceId as string | undefined;
    if (!sub && metaInvoiceId) {
      const [invByMeta] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, metaInvoiceId))
        .limit(1);
      if (invByMeta?.subscriptionId) {
        const [row] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.id, invByMeta.subscriptionId))
          .limit(1);
        sub = row;
      }
    }

    // Legacy: nur interne Rechnung per Stripe-Invoice-ID (ohne bekannte Subscription)
    if (!sub) {
      const [invByProv] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.providerInvoiceId as any, stripeInvoiceId))
        .limit(1);

      if (invByProv) {
        if (invByProv.status !== "paid") {
          await db
            .update(invoices as any)
            .set({
              status: "paid",
              paidAt: new Date(),
              dueAt: null,
            } as any)
            .where(eq(invoices.id, invByProv.id));
        }
        return {
          success: true,
          message: `Invoice ${invByProv.id} marked as paid (no internal subscription match)`,
          updatedInvoiceId: invByProv.id,
        };
      }

      if (metaInvoiceId) {
        const [inv] = await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, metaInvoiceId))
          .limit(1);
        if (!inv) {
          return {
            success: false,
            message: `Invoice ${metaInvoiceId} not found`,
          };
        }
        if (inv.status === "paid") {
          return {
            success: true,
            message: `Invoice ${metaInvoiceId} already paid`,
            updatedInvoiceId: metaInvoiceId,
          };
        }
        await db
          .update(invoices as any)
          .set({
            status: "paid",
            paidAt: new Date(),
            dueAt: null,
            providerInvoiceId: stripeInvoiceId,
          } as any)
          .where(eq(invoices.id, metaInvoiceId));
        return {
          success: true,
          message: `Invoice ${metaInvoiceId} marked as paid`,
          updatedInvoiceId: metaInvoiceId,
        };
      }

      return {
        success: true,
        message: `invoice.paid ignored (unknown subscription / no matching invoice)`,
      };
    }

    const providerEnv = (sub.providerEnv as string) || pEnvGuess;

    await db
      .update(subscriptions as any)
      .set({
        status: "active",
        currentPeriodStart: periodStart ?? sub.currentPeriodStart,
        currentPeriodEnd: periodEnd ?? sub.currentPeriodEnd,
      } as any)
      .where(eq(subscriptions.id, sub.id));

    const cid = String(sub.customerId);
    const sid = String(sub.id);

    const [paidLicense] = await db
      .select()
      .from(licenses)
      .where(
        and(
          eq(licenses.customerId as any, cid),
          eq(licenses.subscriptionId as any, sid),
          ne(licenses.plan as any, "trial"),
          sql`lower(${licenses.plan}) in ('starter','pro')`,
          sql`lower(coalesce(${licenses.status}, '')) = 'active'`,
        ),
      )
      .limit(1);

    if (paidLicense && periodEnd) {
      const cur = paidLicense.validUntil
        ? new Date(paidLicense.validUntil as Date).getTime()
        : 0;
      const next = periodEnd.getTime();
      const newUntil = new Date(Math.max(cur, next));
      await db
        .update(licenses as any)
        .set({ validUntil: newUntil, updatedAt: new Date() } as any)
        .where(eq(licenses.id, paidLicense.id));
    }

    const [existingPay] = await db
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

    const billingReason = String(invoice.billing_reason || "");
    const skipPaymentInsert =
      Boolean(existingPay) ||
      (billingReason === "subscription_create" &&
        (Boolean(metaInvoiceId) ||
          (await this.hasRecentStripeCheckoutPaymentForSubscription(
            sid,
            Number(invoice.amount_paid ?? 0),
          ))));

    let createdPaymentId: string | undefined;
    if (!skipPaymentInsert) {
      const [payment] = await db
        .insert(payments)
        .values({
          orgId: sub.orgId,
          customerId: sub.customerId,
          subscriptionId: sub.id,
          provider: "stripe",
          providerEnv,
          providerPaymentId: stripeInvoiceId,
          providerStatus: String(invoice.status || "paid"),
          amountCents: Number(invoice.amount_paid ?? 0),
          currency: String(invoice.currency || "eur").toUpperCase(),
          status: "succeeded",
          amountGrossCents: Number(invoice.amount_paid ?? 0),
        } as any)
        .returning();
      createdPaymentId = payment?.id;
    }

    let invForLicense: string | undefined;
    let updatedInvoiceId: string | undefined;

    if (metaInvoiceId) {
      const [metaInv] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, metaInvoiceId))
        .limit(1);
      if (metaInv) {
        const billingPeriod =
          (sub.billingPeriod as "monthly" | "yearly" | null) ??
          parseBillingPeriodFromPlanId(
            (invoice.metadata as Record<string, string> | undefined)?.planId,
          );
        await syncPaidInvoiceFromStripeInvoice({
          invoiceId: metaInv.id,
          subscriptionId: sub.id,
          stripeInvoice: invoice as Record<string, unknown>,
          billingPeriod,
          markPaid: metaInv.status !== "paid",
        });
        await db
          .update(invoices as any)
          .set({
            providerInvoiceId: stripeInvoiceId,
            provider: "stripe",
            providerEnv: (metaInv.providerEnv as string) || providerEnv,
          } as any)
          .where(eq(invoices.id, metaInv.id));
        invForLicense = metaInv.id;
        updatedInvoiceId = metaInv.id;
      }
    }

    if (!invForLicense) {
      const [byProv] = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.provider as any, "stripe"),
            eq(invoices.providerEnv as any, providerEnv),
            eq(invoices.providerInvoiceId as any, stripeInvoiceId),
          ),
        )
        .limit(1);

      if (byProv) {
        if (byProv.status !== "paid") {
          await db
            .update(invoices as any)
            .set({
              status: "paid",
              paidAt: new Date(),
              dueAt: null,
            } as any)
            .where(eq(invoices.id, byProv.id));
        }
        invForLicense = byProv.id;
        updatedInvoiceId = byProv.id;
      } else {
        const planName = sub.plan === "starter" ? "Starter" : "Pro";
        const invNumber = this.generateWebhookInvoiceNumber();
        const currency = String(invoice.currency || "eur").toUpperCase();
        const billingPeriod =
          (sub.billingPeriod as "monthly" | "yearly" | null) ??
          parseBillingPeriodFromPlanId(
            (invoice.metadata as Record<string, string> | undefined)?.planId,
          );

        try {
          const { invoiceAmountFieldsFromBreakdown, amountsFromStripeInvoice } =
            await import("../lib/stripeCheckoutAmounts.js");
          const amounts = amountsFromStripeInvoice(invoice as Record<string, unknown>);
          const [newInv] = await db
            .insert(invoices)
            .values({
              orgId: sub.orgId,
              customerId: sub.customerId,
              subscriptionId: sub.id,
              number: invNumber,
              currency,
              status: "paid",
              paidAt: new Date(),
              dueAt: null,
              provider: "stripe",
              providerEnv,
              providerInvoiceId: stripeInvoiceId,
              planName,
              billingPeriod,
              paymentMethod: "card",
              ...invoiceAmountFieldsFromBreakdown(amounts),
            } as any)
            .returning();
          invForLicense = newInv?.id;
          updatedInvoiceId = newInv?.id;
        } catch {
          const [again] = await db
            .select()
            .from(invoices)
            .where(
              and(
                eq(invoices.provider as any, "stripe"),
                eq(invoices.providerEnv as any, providerEnv),
                eq(invoices.providerInvoiceId as any, stripeInvoiceId),
              ),
            )
            .limit(1);
          if (again) {
            invForLicense = again.id;
            updatedInvoiceId = again.id;
          }
        }
      }
    }

    let createdLicenseId: string | undefined;
    if (invForLicense && (sub.plan === "starter" || sub.plan === "pro")) {
      createdLicenseId = await ensurePaidLicenseAfterSuccessfulPayment({
        orgId: String(sub.orgId),
        customerId: cid,
        subscriptionId: sid,
        invoiceId: invForLicense,
        source: "stripe_webhook",
      });
    }

    return {
      success: true,
      message: `invoice.paid processed for subscription ${sub.id}`,
      updatedSubscriptionId: sub.id,
      updatedInvoiceId,
      createdPaymentId,
      createdLicenseId,
    };
  }

  /**
   * Verarbeitet fehlgeschlagene Stripe Zahlung (Lizenz bleibt aktiv).
   */
  private async handleStripePaymentFailed(invoice: any): Promise<ProcessedWebhookResult> {
    const stripeInvoiceId = String(invoice.id || "");
    const stripeSubRef = invoice.subscription;
    const stripeSubId =
      typeof stripeSubRef === "string"
        ? stripeSubRef
        : stripeSubRef?.id
          ? String(stripeSubRef.id)
          : "";

    let updatedSubscriptionId: string | undefined;

    if (stripeSubId) {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.provider as any, "stripe"),
            eq(subscriptions.providerSubscriptionId as any, stripeSubId),
          ),
        )
        .limit(1);

      if (sub) {
        await db
          .update(subscriptions as any)
          .set({ status: "past_due" } as any)
          .where(eq(subscriptions.id, sub.id));
        updatedSubscriptionId = sub.id;
      }
    }

    console.warn("[stripe webhook] invoice.payment_failed", {
      stripeInvoiceId,
      stripeSubId: stripeSubId || null,
      attemptCount: invoice.attempt_count,
      nextPaymentAttempt: invoice.next_payment_attempt,
    });

    const metaInvoiceId = invoice.metadata?.invoiceId as string | undefined;
    return {
      success: true,
      message: `invoice.payment_failed logged (subscription ${updatedSubscriptionId ?? "n/a"} stays billable; license unchanged)`,
      updatedInvoiceId: metaInvoiceId,
      updatedSubscriptionId,
    };
  }

  /**
   * Verarbeitet gekündigte Stripe Subscription.
   */
  private async handleStripeSubscriptionDeleted(subscription: any): Promise<ProcessedWebhookResult> {
    const subscriptionId = subscription.id;

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.provider as any, "stripe"),
          eq(subscriptions.providerSubscriptionId as any, subscriptionId),
        ),
      )
      .limit(1);

    if (!sub) {
      return {
        success: false,
        message: `Subscription with provider ID ${subscriptionId} not found`,
      };
    }

    await db
      .update(subscriptions as any)
      .set({
        status: "cancelled",
        canceledAt: new Date(),
        cancelAtPeriodEnd: 0,
      } as any)
      .where(eq(subscriptions.id, sub.id));

    const now = new Date();
    await db
      .update(licenses as any)
      .set({
        status: "revoked",
        validUntil: now,
        updatedAt: now,
      } as any)
      .where(
        and(
          eq(licenses.subscriptionId as any, String(sub.id)),
          ne(licenses.plan as any, "trial"),
          sql`lower(${licenses.plan}) in ('starter','pro')`,
          sql`lower(coalesce(${licenses.status}, '')) = 'active'`,
        ),
      );

    if (sub.orgId) {
      await notificationService.notifySubscriptionCancelled({
        orgId: String(sub.orgId),
        customerId: sub.customerId ? String(sub.customerId) : undefined,
        subscriptionId: String(sub.id),
        provider: "stripe",
        providerSubscriptionId: subscriptionId,
      });
    }

    return {
      success: true,
      message: `Subscription ${sub.id} cancelled; paid licenses revoked`,
      updatedSubscriptionId: sub.id,
    };
  }

  /**
   * Verarbeitet aktualisierte Stripe Subscription.
   */
  private async handleStripeSubscriptionUpdated(subscription: any): Promise<ProcessedWebhookResult> {
    const subscriptionId = subscription.id;
    const status = subscription.status;

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.provider as any, "stripe"),
          eq(subscriptions.providerSubscriptionId as any, subscriptionId),
        ),
      )
      .limit(1);

    if (!sub) {
      return {
        success: false,
        message: `Subscription with provider ID ${subscriptionId} not found`,
      };
    }

    let mappedStatus = sub.status;
    if (status === "active" || status === "trialing") {
      mappedStatus = "active";
    } else if (status === "past_due" || status === "unpaid") {
      mappedStatus = "past_due";
    } else if (status === "canceled") {
      mappedStatus = "cancelled";
    }

    const priceObj = subscription.items?.data?.[0]?.price;
    const metaPlan = String(priceObj?.metadata?.plan || "").toLowerCase();
    let nextPlan = sub.plan;
    if (metaPlan === "starter" || metaPlan === "pro") {
      nextPlan = metaPlan;
    }

    const cancelAt =
      subscription.cancel_at_period_end === true ||
      subscription.cancel_at_period_end === 1
        ? 1
        : 0;

    await db
      .update(subscriptions as any)
      .set({
        status: mappedStatus,
        plan: nextPlan,
        currentPeriodStart: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : sub.currentPeriodStart,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : sub.currentPeriodEnd,
        cancelAtPeriodEnd: cancelAt,
      } as any)
      .where(eq(subscriptions.id, sub.id));

    return {
      success: true,
      message: `Subscription ${sub.id} updated`,
      updatedSubscriptionId: sub.id,
    };
  }
}

