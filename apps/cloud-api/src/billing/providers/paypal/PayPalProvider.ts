import type { PaymentProvider } from "../PaymentProvider";
import type { CheckoutRequest, CheckoutResponse, ProviderEnv, WebhookHandleResult } from "../../types";

function pickEnv(): ProviderEnv {
  // TODO: passe an eure ENV-Namen an (Beispiel):
  // return process.env.PAYPAL_ENV === "live" ? "live" : "test";
  return "test";
}

export class PayPalProvider implements PaymentProvider {
  name = "paypal" as const;
  env: ProviderEnv = pickEnv();

  // TODO: hier ggf. PayPal SDK Client/Config injizieren
  constructor(/* deps */) {}

  async checkout(req: CheckoutRequest): Promise<CheckoutResponse> {
    // TODO:
    // 1) Erstelle PayPal Order/Subscription (je nach eurem Flow)
    // 2) Hole approval link / checkout url
    // 3) Persistiere DB: invoices/payments/subscriptions/billing_customers etc. (Phase 2.2/2.3)
    //
    // Wichtig für jetzt: nur "checkoutUrl" zurückgeben.

    // PLACEHOLDER:
    const checkoutUrl = "https://www.sandbox.paypal.com/checkoutnow?token=TODO";
    return { checkoutUrl, provider: "paypal", providerEnv: this.env };
  }

  async handleWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>): Promise<WebhookHandleResult> {
    // TODO:
    // - signature verify (paypal headers)
    // - event_id extrahieren
    // - event speichern (webhooks table, event_id unique)
    // - processor ausführen (Phase 2.4)

    return { ok: true, status: "ignored", message: "PayPal webhook stub" };
  }
}

