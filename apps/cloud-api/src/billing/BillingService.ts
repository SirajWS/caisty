import type { CheckoutRequest, CheckoutResponse, ProviderName } from "./types";
import type { PaymentProvider } from "./providers/PaymentProvider";
import { IdempotencyService } from "./IdempotencyService";

export class BillingService {
  constructor(
    private readonly providers: Record<ProviderName, PaymentProvider>,
    private readonly idem: IdempotencyService
  ) {}

  async checkout(req: CheckoutRequest, idempotencyKey?: string): Promise<CheckoutResponse> {
    const provider = this.providers[req.provider];
    if (!provider) throw new Error(`Unsupported provider: ${req.provider}`);

    if (!idempotencyKey) {
      return provider.checkout(req);
    }

    const requestHash = IdempotencyService.hash({
      ...req,
      // nur relevante Felder hashen:
      metadata: req.metadata ?? {},
    });

    const cached = await this.idem.get<CheckoutResponse>(idempotencyKey, requestHash);
    if (cached.hit) return cached.value;

    const result = await provider.checkout(req);
    await this.idem.set(idempotencyKey, requestHash, result);

    return result;
  }
}

