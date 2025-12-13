export type ProviderName = "paypal" | "stripe";

export type ProviderEnv = "test" | "live";

export type CheckoutIntent = "subscription" | "payment";

export type CheckoutRequest = {
  provider: ProviderName;
  planId: string;           // dein internes Plan-Key (oder PriceId später)
  customerId?: string;      // optional (wenn eingeloggter user)
  returnUrl: string;
  cancelUrl: string;
  currency?: string;        // optional
  locale?: string;          // optional
  metadata?: Record<string, string>;
};

export type CheckoutResponse = {
  checkoutUrl: string;
  provider: ProviderName;
  providerEnv: ProviderEnv;
};

export type WebhookHandleResult = {
  ok: boolean;
  status: "processed" | "ignored" | "failed";
  message?: string;
  providerEventId?: string;
};

export type IdempotencyResult<T> =
  | { hit: true; value: T }
  | { hit: false };

