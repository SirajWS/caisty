import type { CheckoutRequest, CheckoutResponse, ProviderEnv, ProviderName, WebhookHandleResult } from "../types";

export interface PaymentProvider {
  name: ProviderName;
  env: ProviderEnv;

  checkout(req: CheckoutRequest): Promise<CheckoutResponse>;

  /**
   * Webhook handling (Provider-spezifisch).
   * Wichtig: Diese Methode soll idempotent sein (eventId unique).
   */
  handleWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>): Promise<WebhookHandleResult>;
}

