import type { PaymentProvider } from "../PaymentProvider.js";
import type {
  CheckoutRequest,
  CheckoutResponse,
  ProviderEnv,
  WebhookHandleResult,
} from "../../types.js";
import { getStripePriceId } from "../../../config/stripePrices.js";
import { ENV } from "../../../config/env.js";

export class StripeProvider implements PaymentProvider {
  name = "stripe" as const;
  env: ProviderEnv;
  private secretKey: string;

  constructor() {
    this.env = (ENV.STRIPE_ENV === "live" ? "live" : "test") as ProviderEnv;
    
    this.secretKey = this.env === "live"
      ? ENV.STRIPE_SECRET_KEY_LIVE
      : ENV.STRIPE_SECRET_KEY_TEST;

    if (!this.secretKey) {
      // In Testmode: Warnung, aber nicht crashen (damit PayPal weiter funktioniert)
      console.warn("⚠️ Stripe secret key not configured. Stripe checkout will fail.");
    }
  }

  async checkout(req: CheckoutRequest): Promise<CheckoutResponse> {
    if (!this.secretKey) {
      throw new Error("Stripe secret key not configured. Please set STRIPE_SECRET_KEY_TEST or STRIPE_SECRET_KEY_LIVE in .env");
    }

    // Parse planId (format: "starter_monthly" or "pro_yearly" etc.)
    const planIdParts = req.planId.split("_");
    const plan = planIdParts[0] as "starter" | "pro";
    const period = req.planId.includes("yearly") ? "yearly" : "monthly";
    const currency = (req.currency ?? "EUR") as "EUR" | "TND";

    // Get Stripe Price ID from config
    const stripePriceId = getStripePriceId(plan, currency, period);

    if (!stripePriceId) {
      throw new Error(
        `Stripe Price ID not configured for ${plan}_${period} (${currency}). ` +
        `Please set STRIPE_PRICE_${plan.toUpperCase()}_${period.toUpperCase()}_${currency} in .env`
      );
    }

    // Create Stripe Checkout Session using Price ID
    // Stripe API with application/x-www-form-urlencoded requires array format for arrays
    // Format: payment_method_types[0]=card, line_items[0][price]=..., etc.
    const params = new URLSearchParams({
      mode: "subscription",
      // Stripe fügt automatisch session_id als Query-Parameter hinzu
      // Format: {CHECKOUT_SESSION_ID} wird von Stripe durch die tatsächliche Session-ID ersetzt
      success_url: req.returnUrl.includes("?") 
        ? `${req.returnUrl}&session_id={CHECKOUT_SESSION_ID}`
        : `${req.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: req.cancelUrl,
      billing_address_collection: "required",
    });

    // Add payment_method_types as array format (Stripe requirement for URLSearchParams)
    params.append("payment_method_types[0]", "card");

    // Add line_items as array format (Stripe requirement for URLSearchParams)
    params.append("line_items[0][price]", stripePriceId);
    params.append("line_items[0][quantity]", "1");

    // Add metadata as flat key/value pairs (Stripe requirement)
    if (req.planId) params.append("metadata[planId]", String(req.planId));
    if (req.customerId) params.append("metadata[customerId]", String(req.customerId || ""));
    if (req.metadata?.invoiceId) params.append("metadata[invoiceId]", String(req.metadata.invoiceId));

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!sessionRes.ok) {
      const errorText = await sessionRes.text();
      throw new Error(`Stripe checkout session failed: ${sessionRes.status} ${errorText}`);
    }

    const session = await sessionRes.json();

    if (!session.url) {
      throw new Error("Stripe session missing URL");
    }

    return {
      checkoutUrl: session.url,
      provider: "stripe",
      providerEnv: this.env,
    };
  }

  async handleWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookHandleResult> {
    // TODO: Stripe Signature-Verifikation (später)
    // Für jetzt: Webhook Secret prüfen, aber keine vollständige Verifikation
    const signature = headers["stripe-signature"];
    const webhookSecret = this.env === "live"
      ? ENV.STRIPE_WEBHOOK_SECRET_LIVE
      : ENV.STRIPE_WEBHOOK_SECRET_TEST;

    // In Development: Warnung, aber nicht blockieren
    if (!webhookSecret && process.env.NODE_ENV !== "development") {
      return {
        ok: false,
        status: "failed",
        message: "Stripe webhook secret not configured",
      };
    }

    let eventData: any;
    try {
      eventData = JSON.parse(rawBody);
    } catch (err) {
      return {
        ok: false,
        status: "failed",
        message: "Invalid JSON payload",
      };
    }

    const eventId = eventData.id;
    const eventType = eventData.type || "unknown";

    if (!eventId) {
      return {
        ok: false,
        status: "failed",
        message: "Missing event ID",
      };
    }

    // Verarbeite das Event mit WebhookProcessor
    try {
      const { WebhookProcessor } = await import("../../WebhookProcessor.js");
      const processor = new WebhookProcessor();
      const result = await processor.processStripeEvent(eventType, eventData);

      if (!result.success) {
        return {
          ok: false,
          status: "failed",
          message: result.message,
          providerEventId: eventId,
        };
      }

      return {
        ok: true,
        status: "processed",
        providerEventId: eventId,
        message: result.message,
      };
    } catch (err: any) {
      return {
        ok: false,
        status: "failed",
        message: `Error processing webhook: ${err?.message || "Unknown error"}`,
        providerEventId: eventId,
      };
    }
  }
}

