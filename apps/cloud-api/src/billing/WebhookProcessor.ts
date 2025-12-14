// apps/cloud-api/src/billing/WebhookProcessor.ts
import { db } from "../db/client.js";
import { invoices } from "../db/schema/invoices.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { payments } from "../db/schema/payments.js";
import { licenses } from "../db/schema/licenses.js";
import { licenseEvents } from "../db/schema/licenseEvents.js";
import { eq, and, ne } from "drizzle-orm";
import { addMonths } from "date-fns";
import { generateLicenseKey } from "../lib/licenseKey.js";
import { notificationService } from "./NotificationService.js";

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

    // Lizenz erstellen, falls noch keine existiert
    let createdLicenseId: string | undefined;
    if (inv.customerId && inv.orgId && inv.subscriptionId) {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, inv.subscriptionId))
        .limit(1);

      if (sub) {
        const [existingLicense] = await db
          .select()
          .from(licenses)
          .where(
            and(
              eq(licenses.customerId as any, inv.customerId),
              ne(licenses.plan as any, "trial"),
              eq(licenses.status as any, "active"),
            ),
          )
          .limit(1);

        if (!existingLicense) {
          const now = new Date();
          const maxDevices = sub.plan === "starter" ? 1 : sub.plan === "pro" ? 3 : 1;
          const licenseKey = generateLicenseKey("CSTY");

          const [createdLicense] = await db
            .insert(licenses)
            .values({
              orgId: String(inv.orgId),
              customerId: String(inv.customerId),
              subscriptionId: String(inv.subscriptionId),
              plan: sub.plan,
              status: "active",
              key: licenseKey,
              maxDevices,
              validFrom: now,
              validUntil: sub.currentPeriodEnd || addMonths(now, 1),
            } as any)
            .returning();

          if (createdLicense) {
            createdLicenseId = createdLicense.id;

            // License Event protokollieren
            await db.insert(licenseEvents).values({
              orgId: String(inv.orgId),
              licenseId: createdLicense.id,
              type: "created",
              metadata: {
                source: "paypal_webhook",
                invoiceId: String(inv.id),
                subscriptionId: String(inv.subscriptionId),
                orderId: orderId,
              },
            });

            // Trial-Lizenzen auf "revoked" setzen
            await db
              .update(licenses as any)
              .set({ status: "revoked" } as any)
              .where(
                and(
                  eq(licenses.customerId as any, inv.customerId),
                  eq(licenses.plan as any, "trial"),
                  eq(licenses.status as any, "active"),
                ),
              );
          }
        }
      }
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
        providerRef: sessionId,
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
    const amountCents = session.amount_total || inv.amountCents;

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

    // Lizenz erstellen (gleiche Logik wie PayPal)
    let createdLicenseId: string | undefined;
    if (inv.customerId && inv.orgId && inv.subscriptionId) {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, inv.subscriptionId))
        .limit(1);

      if (sub) {
        const [existingLicense] = await db
          .select()
          .from(licenses)
          .where(
            and(
              eq(licenses.customerId as any, inv.customerId),
              ne(licenses.plan as any, "trial"),
              eq(licenses.status as any, "active"),
            ),
          )
          .limit(1);

        if (!existingLicense) {
          const now = new Date();
          const maxDevices = sub.plan === "starter" ? 1 : sub.plan === "pro" ? 3 : 1;
          const licenseKey = generateLicenseKey("CSTY");

          const [createdLicense] = await db
            .insert(licenses)
            .values({
              orgId: String(inv.orgId),
              customerId: String(inv.customerId),
              subscriptionId: String(inv.subscriptionId),
              plan: sub.plan,
              status: "active",
              key: licenseKey,
              maxDevices,
              validFrom: now,
              validUntil: sub.currentPeriodEnd || addMonths(now, 1),
            } as any)
            .returning();

          if (createdLicense) {
            createdLicenseId = createdLicense.id;

            await db.insert(licenseEvents).values({
              orgId: String(inv.orgId),
              licenseId: createdLicense.id,
              type: "created",
              metadata: {
                source: "stripe_webhook",
                invoiceId: String(inv.id),
                subscriptionId: String(inv.subscriptionId),
                sessionId: sessionId,
              },
            });

            await db
              .update(licenses as any)
              .set({ status: "revoked" } as any)
              .where(
                and(
                  eq(licenses.customerId as any, inv.customerId),
                  eq(licenses.plan as any, "trial"),
                  eq(licenses.status as any, "active"),
                ),
              );
          }
        }
      }
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

  /**
   * Verarbeitet bezahlte Stripe Invoice.
   */
  private async handleStripeInvoicePaid(invoice: any): Promise<ProcessedWebhookResult> {
    // Stripe Invoice ID → unsere Invoice finden (über providerInvoiceId oder metadata)
    const stripeInvoiceId = invoice.id;
    const invoiceId = invoice.metadata?.invoiceId;

    if (!invoiceId) {
      // Versuche über providerInvoiceId zu finden
      const [inv] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.providerInvoiceId as any, stripeInvoiceId))
        .limit(1);

      if (!inv) {
        return {
          success: false,
          message: `Invoice with Stripe ID ${stripeInvoiceId} not found`,
        };
      }

      // Invoice aktualisieren
      await db
        .update(invoices as any)
        .set({
          status: "paid",
          paidAt: new Date(),
          dueAt: null,
        } as any)
        .where(eq(invoices.id, inv.id));

      return {
        success: true,
        message: `Invoice ${inv.id} marked as paid`,
        updatedInvoiceId: inv.id,
      };
    }

    // Normale Verarbeitung mit invoiceId
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

    if (inv.status === "paid") {
      return {
        success: true,
        message: `Invoice ${invoiceId} already paid`,
        updatedInvoiceId: invoiceId,
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
      .where(eq(invoices.id, invoiceId));

    return {
      success: true,
      message: `Invoice ${invoiceId} marked as paid`,
      updatedInvoiceId: invoiceId,
    };
  }

  /**
   * Verarbeitet fehlgeschlagene Stripe Zahlung.
   */
  private async handleStripePaymentFailed(invoice: any): Promise<ProcessedWebhookResult> {
    const invoiceId = invoice.metadata?.invoiceId;

    if (!invoiceId) {
      return {
        success: false,
        message: "Invoice ID not found in Stripe invoice metadata",
      };
    }

    // Invoice bleibt "open" (Retry möglich)
    // Optional: Notification erstellen

    return {
      success: true,
      message: `Payment failed for invoice ${invoiceId} (logged)`,
      updatedInvoiceId: invoiceId,
    };
  }

  /**
   * Verarbeitet gekündigte Stripe Subscription.
   */
  private async handleStripeSubscriptionDeleted(subscription: any): Promise<ProcessedWebhookResult> {
    const subscriptionId = subscription.id;

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
          provider: "stripe",
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
   * Verarbeitet aktualisierte Stripe Subscription.
   */
  private async handleStripeSubscriptionUpdated(subscription: any): Promise<ProcessedWebhookResult> {
    const subscriptionId = subscription.id;
    const status = subscription.status; // active, past_due, canceled, etc.

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.providerSubscriptionId as any, subscriptionId))
      .limit(1);

    if (sub) {
      // Mappe Stripe Status zu unserem Status
      let mappedStatus = sub.status;
      if (status === "active") {
        mappedStatus = "active";
      } else if (status === "past_due" || status === "unpaid") {
        mappedStatus = "past_due";
      } else if (status === "canceled") {
        mappedStatus = "cancelled";
      }

      await db
        .update(subscriptions as any)
        .set({
          status: mappedStatus,
          currentPeriodStart: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : sub.currentPeriodStart,
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : sub.currentPeriodEnd,
        } as any)
        .where(eq(subscriptions.id, sub.id));

      return {
        success: true,
        message: `Subscription ${sub.id} updated`,
        updatedSubscriptionId: sub.id,
      };
    }

    return {
      success: false,
      message: `Subscription with provider ID ${subscriptionId} not found`,
    };
  }
}

