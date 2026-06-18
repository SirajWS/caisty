/** Resolve admin deep-link for a notification row (read-only helper). */

export type NotificationTarget = {
  href: string | null;
  label: string;
  category: "customer" | "payment" | "license" | "support" | "subscription" | "other";
};

export function resolveNotificationTarget(input: {
  type: string;
  customerId?: string | null;
  licenseId?: string | null;
  data?: Record<string, unknown> | null;
}): NotificationTarget {
  const type = input.type ?? "";
  const data = input.data ?? {};
  const customerId =
    input.customerId ??
    (typeof data.customerId === "string" ? data.customerId : null);
  const licenseId =
    input.licenseId ??
    (typeof data.licenseId === "string" ? data.licenseId : null);
  const invoiceId =
    typeof data.invoiceId === "string" ? data.invoiceId : null;
  const subscriptionId =
    typeof data.subscriptionId === "string" ? data.subscriptionId : null;
  const supportMessageId =
    typeof data.supportMessageId === "string" ? data.supportMessageId : null;

  if (type === "portal_support_message" && supportMessageId) {
    return {
      href: `/notifications?support=${encodeURIComponent(supportMessageId)}`,
      label: "Support öffnen",
      category: "support",
    };
  }

  if (
    type === "paypal_payment_completed" ||
    type === "stripe_payment_completed" ||
    type === "invoice_paid" ||
    type === "invoice_created"
  ) {
    if (invoiceId) {
      return {
        href: `/invoices/${invoiceId}`,
        label: "Rechnung",
        category: "payment",
      };
    }
  }

  if (
    type === "license_created" ||
    type === "license_activated" ||
    type === "license_expired" ||
    type === "portal_trial_created"
  ) {
    if (licenseId) {
      return {
        href: `/licenses/${licenseId}`,
        label: "Lizenz",
        category: "license",
      };
    }
  }

  if (
    type === "subscription_created" ||
    type === "subscription_activated" ||
    type === "paypal_subscription_cancelled" ||
    type === "stripe_subscription_cancelled" ||
    type === "subscription_suspended"
  ) {
    if (customerId) {
      return {
        href: `/customers/${customerId}`,
        label: "Kunde",
        category: "subscription",
      };
    }
    if (subscriptionId) {
      return {
        href: `/subscriptions`,
        label: "Abo",
        category: "subscription",
      };
    }
  }

  if (
    type === "portal_signup" ||
    type === "paypal_payment_failed" ||
    type === "stripe_payment_failed"
  ) {
    if (customerId) {
      return {
        href: `/customers/${customerId}`,
        label: "Kunde",
        category: type.includes("payment") ? "payment" : "customer",
      };
    }
  }

  if (customerId) {
    return {
      href: `/customers/${customerId}`,
      label: "Kunde",
      category: "customer",
    };
  }

  return { href: null, label: "Details", category: "other" };
}
