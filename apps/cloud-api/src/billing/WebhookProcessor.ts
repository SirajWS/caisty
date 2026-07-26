// apps/cloud-api/src/billing/WebhookProcessor.ts
import { db } from "../db/client.js";
import { invoices } from "../db/schema/invoices.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { payments } from "../db/schema/payments.js";
import { licenses } from "../db/schema/licenses.js";
import { and, eq, ne, sql } from "drizzle-orm";
import { notificationService } from "./NotificationService.js";
import { ensurePaidLicenseAfterSuccessfulPayment } from "../lib/finalizePaidLicenseAfterPayment.js";
import {
  persistStripeSubscriptionAfterCheckoutSession,
  invoiceProviderEnvToStripeEnv,
} from "../lib/persistStripeSubscriptionFromSession.js";
import { ensureStripePaidInvoiceFromCheckoutSession } from "../lib/ensureStripePaidInvoice.js";
import { ENV } from "../config/env.js";
import { syncPaidInvoiceFromStripeCheckoutSession } from "../lib/syncPaidInvoiceFromStripe.js";
import { processStripePaidInvoice } from "../lib/processStripePaidInvoice.js";

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
      case "invoice.payment_succeeded":
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
    const providerEnv = (ENV.STRIPE_ENV === "live" ? "live" : "test") as "test" | "live";

    let ensured: Awaited<ReturnType<typeof ensureStripePaidInvoiceFromCheckoutSession>>;
    try {
      ensured = await ensureStripePaidInvoiceFromCheckoutSession({
        session: session as Record<string, unknown>,
        providerEnv,
      });
    } catch (err: unknown) {
      return {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : "Could not create or resolve invoice from Stripe checkout",
      };
    }

    const invoiceId = ensured.invoiceId;

    const [inv] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!inv) {
      return {
        success: false,
        message: `Invoice ${invoiceId} not found after Stripe checkout`,
      };
    }

    await persistStripeSubscriptionAfterCheckoutSession({
      portalCustomerId: inv.customerId,
      internalSubscriptionId: inv.subscriptionId,
      session,
      providerEnv: invoiceProviderEnvToStripeEnv(inv.providerEnv),
    });

    if (inv.status === "paid" && !ensured.created) {
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

    const amountCents = Number(inv.amountGrossCents ?? inv.amountCents ?? session.amount_total ?? 0);

    const [existingPayment] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.provider as any, "stripe"),
          eq(payments.providerPaymentId as any, sessionId),
        ),
      )
      .limit(1);

    let payment = existingPayment;
    if (!existingPayment) {
      const [inserted] = await db
        .insert(payments)
        .values({
          orgId: inv.orgId,
          customerId: inv.customerId,
          subscriptionId: inv.subscriptionId || null,
          provider: "stripe",
          providerEnv: inv.providerEnv || "test",
          providerPaymentId: sessionId,
          providerStatus: "paid",
          amountCents,
          currency: inv.currency || "EUR",
          status: "succeeded",
          amountGrossCents: amountCents,
        } as any)
        .returning();
      payment = inserted;
    }

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
        amountCents,
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
   * Verarbeitet bezahlte Stripe Invoice (Renewal + erste Zahlung).
   * Delegiert an zentralen idempotenten Handler — unresolved Match = failure (nicht silent ok).
   */
  private async handleStripeInvoicePaid(invoice: any): Promise<ProcessedWebhookResult> {
    const result = await processStripePaidInvoice({
      invoice: invoice as Record<string, unknown>,
      source: "webhook",
    });
    return {
      success: result.success,
      message: result.message,
      updatedInvoiceId: result.updatedInvoiceId,
      updatedSubscriptionId: result.updatedSubscriptionId,
      createdPaymentId: result.createdPaymentId,
      createdLicenseId: result.createdLicenseId ?? result.extendedLicenseId,
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

