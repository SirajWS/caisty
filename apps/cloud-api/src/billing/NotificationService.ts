// apps/cloud-api/src/billing/NotificationService.ts
import { db } from "../db/client.js";
import { notifications } from "../db/schema/notifications.js";

/**
 * Zentrale Service-Klasse für alle Notification-Erstellungen.
 * Stellt Helper-Methoden für alle Event-Typen bereit.
 */
export class NotificationService {
  /**
   * Basis-Methode zum Erstellen von Notifications.
   */
  private async create(input: {
    orgId: string;
    type: string;
    title: string;
    body?: string;
    customerId?: string | null;
    licenseId?: string | null;
    data?: any;
  }) {
    const [row] = await db
      .insert(notifications)
      .values({
        orgId: input.orgId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        customerId: input.customerId ?? null,
        licenseId: input.licenseId ?? null,
        data: input.data ?? null,
      })
      .returning();
    return row;
  }

  // ==================== SUBSCRIPTION EVENTS ====================

  /**
   * Notification: Neue Subscription erstellt.
   */
  async notifySubscriptionCreated(args: {
    orgId: string;
    customerId: string;
    customerName?: string;
    subscriptionId: string;
    plan: string;
    priceCents: number;
    currency: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "subscription_created",
      title: "Neue Subscription erstellt",
      body: `${args.customerName || "Kunde"} hat eine ${args.plan}-Subscription gestartet`,
      customerId: args.customerId || null,
      data: {
        subscriptionId: args.subscriptionId,
        plan: args.plan,
        priceCents: args.priceCents,
        currency: args.currency,
      },
    });
  }

  /**
   * Notification: Subscription aktiviert.
   */
  async notifySubscriptionActivated(args: {
    orgId: string;
    customerId: string;
    customerName?: string;
    subscriptionId: string;
    plan: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "subscription_activated",
      title: "Subscription aktiviert",
      body: `${args.customerName || "Kunde"} hat eine ${args.plan}-Subscription aktiviert`,
      customerId: args.customerId || null,
      data: {
        subscriptionId: args.subscriptionId,
        plan: args.plan,
      },
    });
  }

  /**
   * Notification: Subscription gekündigt.
   */
  async notifySubscriptionCancelled(args: {
    orgId: string;
    customerId?: string;
    customerName?: string;
    subscriptionId: string;
    provider: "paypal" | "stripe";
    providerSubscriptionId?: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: `${args.provider}_subscription_cancelled`,
      title: "Subscription gekündigt",
      body: `${args.customerName || "Kunde"} hat eine Subscription gekündigt`,
      customerId: args.customerId || null,
      data: {
        subscriptionId: args.subscriptionId,
        provider: args.provider,
        providerSubscriptionId: args.providerSubscriptionId,
      },
    });
  }

  /**
   * Notification: Subscription pausiert/überfällig.
   */
  async notifySubscriptionSuspended(args: {
    orgId: string;
    customerId?: string;
    customerName?: string;
    subscriptionId: string;
    reason?: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "subscription_suspended",
      title: "Subscription pausiert",
      body: `Subscription wurde pausiert${args.reason ? `: ${args.reason}` : ""}`,
      customerId: args.customerId || null,
      data: {
        subscriptionId: args.subscriptionId,
        reason: args.reason,
      },
    });
  }

  // ==================== PAYMENT EVENTS ====================

  /**
   * Notification: Zahlung erfolgreich (PayPal).
   */
  async notifyPayPalPaymentCompleted(args: {
    orgId: string;
    customerId?: string;
    invoiceId: string;
    invoiceNumber: string;
    orderId?: string;
    amountCents: number;
    currency: string;
    licenseId?: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "paypal_payment_completed",
      title: "PayPal Zahlung erfolgreich",
      body: `Zahlung für Rechnung ${args.invoiceNumber} wurde erfolgreich verarbeitet.`,
      customerId: args.customerId || null,
      licenseId: args.licenseId || null,
      data: {
        invoiceId: args.invoiceId,
        invoiceNumber: args.invoiceNumber,
        orderId: args.orderId,
        amountCents: args.amountCents,
        currency: args.currency,
      },
    });
  }

  /**
   * Notification: Zahlung erfolgreich (Stripe).
   */
  async notifyStripePaymentCompleted(args: {
    orgId: string;
    customerId?: string;
    invoiceId: string;
    invoiceNumber: string;
    sessionId?: string;
    amountCents: number;
    currency: string;
    licenseId?: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "stripe_payment_completed",
      title: "Stripe Zahlung erfolgreich",
      body: `Zahlung für Rechnung ${args.invoiceNumber} wurde erfolgreich verarbeitet.`,
      customerId: args.customerId || null,
      licenseId: args.licenseId || null,
      data: {
        invoiceId: args.invoiceId,
        invoiceNumber: args.invoiceNumber,
        sessionId: args.sessionId,
        amountCents: args.amountCents,
        currency: args.currency,
      },
    });
  }

  /**
   * Notification: Zahlung fehlgeschlagen.
   */
  async notifyPaymentFailed(args: {
    orgId: string;
    customerId?: string;
    invoiceId: string;
    invoiceNumber: string;
    provider: "paypal" | "stripe";
    reason?: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: `${args.provider}_payment_failed`,
      title: "Zahlung fehlgeschlagen",
      body: `Zahlung für Rechnung ${args.invoiceNumber} ist fehlgeschlagen${args.reason ? `: ${args.reason}` : ""}`,
      customerId: args.customerId || null,
      data: {
        invoiceId: args.invoiceId,
        invoiceNumber: args.invoiceNumber,
        provider: args.provider,
        reason: args.reason,
      },
    });
  }

  // ==================== INVOICE EVENTS ====================

  /**
   * Notification: Rechnung erstellt.
   */
  async notifyInvoiceCreated(args: {
    orgId: string;
    customerId: string;
    invoiceId: string;
    invoiceNumber: string;
    amountCents: number;
    currency: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "invoice_created",
      title: "Neue Rechnung erstellt",
      body: `Rechnung ${args.invoiceNumber} wurde erstellt`,
      customerId: args.customerId || null,
      data: {
        invoiceId: args.invoiceId,
        invoiceNumber: args.invoiceNumber,
        amountCents: args.amountCents,
        currency: args.currency,
      },
    });
  }

  /**
   * Notification: Rechnung bezahlt.
   */
  async notifyInvoicePaid(args: {
    orgId: string;
    customerId?: string;
    invoiceId: string;
    invoiceNumber: string;
    provider: "paypal" | "stripe";
    amountCents: number;
    currency: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "invoice_paid",
      title: "Rechnung bezahlt",
      body: `Rechnung ${args.invoiceNumber} wurde erfolgreich bezahlt`,
      customerId: args.customerId || null,
      data: {
        invoiceId: args.invoiceId,
        invoiceNumber: args.invoiceNumber,
        provider: args.provider,
        amountCents: args.amountCents,
        currency: args.currency,
      },
    });
  }

  // ==================== LICENSE EVENTS ====================

  /**
   * Notification: Lizenz erstellt.
   */
  async notifyLicenseCreated(args: {
    orgId: string;
    customerId?: string;
    licenseId: string;
    licenseKey: string;
    plan: string;
    source: string; // "portal_payment" | "paypal_webhook" | "stripe_webhook" | "trial"
    invoiceId?: string;
    subscriptionId?: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "license_created",
      title: "Lizenz erstellt",
      body: `Neue ${args.plan}-Lizenz ${args.licenseKey} wurde erstellt`,
      customerId: args.customerId || null,
      licenseId: args.licenseId,
      data: {
        licenseId: args.licenseId,
        licenseKey: args.licenseKey,
        plan: args.plan,
        source: args.source,
        invoiceId: args.invoiceId,
        subscriptionId: args.subscriptionId,
      },
    });
  }

  /**
   * Notification: Lizenz aktiviert.
   */
  async notifyLicenseActivated(args: {
    orgId: string;
    customerId: string;
    licenseId: string;
    licenseKey: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "license_activated",
      title: "Lizenz aktiviert",
      body: `Lizenz ${args.licenseKey} wurde aktiviert`,
      customerId: args.customerId || null,
      licenseId: args.licenseId,
      data: {
        licenseId: args.licenseId,
        licenseKey: args.licenseKey,
      },
    });
  }

  /**
   * Notification: Lizenz abgelaufen.
   */
  async notifyLicenseExpired(args: {
    orgId: string;
    customerId: string;
    licenseId: string;
    licenseKey: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "license_expired",
      title: "Lizenz abgelaufen",
      body: `Lizenz ${args.licenseKey} ist abgelaufen`,
      customerId: args.customerId || null,
      licenseId: args.licenseId,
      data: {
        licenseId: args.licenseId,
        licenseKey: args.licenseKey,
      },
    });
  }

  // ==================== PORTAL EVENTS ====================

  /**
   * Notification: Neues Portal-Konto registriert.
   */
  async notifyPortalSignup(args: {
    orgId: string;
    customerId: string;
    customerName?: string;
    customerEmail: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "portal_signup",
      title: "Neues Portal-Konto",
      body: `${args.customerName || args.customerEmail} hat sich registriert`,
      customerId: args.customerId || null,
      data: {
        customerName: args.customerName,
        customerEmail: args.customerEmail,
      },
    });
  }

  /**
   * Notification: Trial-Lizenz erstellt.
   */
  async notifyTrialLicenseCreated(args: {
    orgId: string;
    customerId: string;
    customerName?: string;
    licenseId: string;
    licenseKey: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "portal_trial_created",
      title: "Trial-Lizenz erstellt",
      body: `${args.customerName || "Kunde"} hat eine Trial-Lizenz angefordert`,
      customerId: args.customerId || null,
      licenseId: args.licenseId,
      data: {
        licenseId: args.licenseId,
        licenseKey: args.licenseKey,
      },
    });
  }

  /**
   * Notification: Support-Nachricht erhalten.
   */
  async notifySupportMessage(args: {
    orgId: string;
    customerId: string;
    customerName?: string;
    customerEmail: string;
    subject: string;
    message: string;
    supportMessageId: string;
  }) {
    return this.create({
      orgId: args.orgId,
      type: "portal_support_message",
      title: `Support-Anfrage: ${args.subject}`,
      body: args.message,
      customerId: args.customerId || null,
      data: {
        customerName: args.customerName,
        customerEmail: args.customerEmail,
        subject: args.subject,
        supportMessageId: args.supportMessageId,
      },
    });
  }
}

// Singleton-Instanz exportieren
export const notificationService = new NotificationService();

