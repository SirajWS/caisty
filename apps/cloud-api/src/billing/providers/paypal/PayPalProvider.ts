import type { PaymentProvider } from "../PaymentProvider.js";
import type {
  CheckoutRequest,
  CheckoutResponse,
  ProviderEnv,
  WebhookHandleResult,
} from "../../types.js";

type PayPalAccessTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export class PayPalProvider implements PaymentProvider {
  name = "paypal" as const;
  env: ProviderEnv;

  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.env = process.env.PAYPAL_ENV === "live" ? "live" : "test";

    this.baseUrl =
      this.env === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    this.clientId = process.env.PAYPAL_CLIENT_ID!;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

    if (!this.clientId || !this.clientSecret) {
      throw new Error("PayPal env vars missing");
    }
  }

  /* =========================
     AUTH
     ========================= */

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString("base64");

    const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      throw new Error("PayPal auth failed");
    }

    const json = (await res.json()) as PayPalAccessTokenResponse;
    return json.access_token;
  }

  /* =========================
     CHECKOUT
     ========================= */

  async checkout(req: CheckoutRequest): Promise<CheckoutResponse> {
    const token = await this.getAccessToken();

    // Parse planId (format: "starter" or "pro" or "starter_monthly" etc.)
    const planId = req.planId.split("_")[0] as "starter" | "pro";
    const period = req.planId.includes("yearly") ? "yearly" : "monthly";
    const currency = (req.currency ?? "EUR") as "EUR" | "TND";

    // Get price from pricing config
    const { getPlanPrice } = await import("../../../config/pricing.js");
    const price = getPlanPrice(planId, currency, period);
    const priceStr = price.toFixed(2);

    const orderRes = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: priceStr,
            },
            description: `${planId} - ${period}`,
          },
        ],
        application_context: {
          brand_name: "Caisty",
          return_url: req.returnUrl,
          cancel_url: req.cancelUrl,
          user_action: "PAY_NOW",
        },
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      throw new Error(`PayPal order failed: ${err}`);
    }

    const order = await orderRes.json();

    const approveLink = order.links?.find(
      (l: any) => l.rel === "approve"
    )?.href;

    if (!approveLink) {
      throw new Error("PayPal approve link missing");
    }

    return {
      checkoutUrl: approveLink,
      provider: "paypal",
      providerEnv: this.env,
    };
  }

  /* =========================
     CAPTURE ORDER
     ========================= */

  /**
   * Captures a PayPal order (used after user approves payment)
   * DEV-Bypass: If orderId starts with "DEV_", returns true immediately
   */
  async captureOrder(orderId: string): Promise<boolean> {
    // DEV-Bypass: ermöglicht lokale Tests ohne echtes PayPal-Capture
    if (orderId.startsWith("DEV_")) {
      return true;
    }

    const accessToken = await this.getAccessToken();

    const res = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(
        `PayPal capture failed: ${res.status} ${res.statusText} – ${txt}`,
      );
    }

    const data = (await res.json()) as any;
    return data.status === "COMPLETED";
  }

  /* =========================
     WEBHOOK
     ========================= */

  async handleWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookHandleResult> {
    // TODO: Signature verification (Phase 2.5)
    // For now, we trust the webhook

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

    const eventId = eventData.id || eventData.event_id;
    const eventType = eventData.event_type || eventData.type || "unknown";

    if (!eventId) {
      return {
        ok: false,
        status: "failed",
        message: "Missing event ID",
      };
    }

    // Webhook will be persisted by the webhook route handler
    // We just return the event info for processing
    return {
      ok: true,
      status: "processed",
      providerEventId: eventId,
      message: `PayPal event ${eventType} received`,
    };
  }
}
