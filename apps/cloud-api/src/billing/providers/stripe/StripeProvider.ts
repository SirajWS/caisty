import type { PaymentProvider } from "../PaymentProvider";
import type { CheckoutRequest, CheckoutResponse, ProviderEnv, WebhookHandleResult } from "../../types";

export class StripeProvider implements PaymentProvider {
  name = "stripe" as const;
  env: ProviderEnv = "test"; // TODO später aus STRIPE_ENV ableiten

  constructor(/* deps */) {}

  async checkout(_req: CheckoutRequest): Promise<CheckoutResponse> {
    // Stub bis Stripe Konto/Keys da sind
    throw new Error("Stripe checkout not implemented yet");
  }

  async handleWebhook(_rawBody: string, _headers: Record<string, string | string[] | undefined>): Promise<WebhookHandleResult> {
    return { ok: true, status: "ignored", message: "Stripe webhook stub" };
  }
}

