import { BillingService } from "./BillingService";
import { PayPalProvider } from "./providers/paypal/PayPalProvider";
import { StripeProvider } from "./providers/stripe/StripeProvider";
import { IdempotencyService } from "./IdempotencyService";

export const billingService = new BillingService(
  {
    paypal: new PayPalProvider(),
    stripe: new StripeProvider(),
  },
  new IdempotencyService()
);

