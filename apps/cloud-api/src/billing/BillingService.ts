import type { CheckoutRequest, CheckoutResponse, ProviderName } from "./types";
import type { PaymentProvider } from "./providers/PaymentProvider";
import { IdempotencyService } from "./IdempotencyService";

export class BillingService {
  constructor(
    public readonly providers: Record<ProviderName, PaymentProvider>,
    private readonly idem: IdempotencyService
  ) {}

  async checkout(req: CheckoutRequest, idempotencyKey?: string, orgId?: string): Promise<CheckoutResponse> {
    const provider = this.providers[req.provider];
    if (!provider) throw new Error(`Unsupported provider: ${req.provider}`);

    if (!idempotencyKey || !orgId) {
      return provider.checkout(req);
    }

    const requestHash = IdempotencyService.hash({
      ...req,
      // nur relevante Felder hashen:
      metadata: req.metadata ?? {},
    });

    const cached = await this.idem.get<CheckoutResponse>(idempotencyKey, requestHash, orgId);
    if (cached.hit) return cached.value;

    const result = await provider.checkout(req);
    await this.idem.set(idempotencyKey, requestHash, result, orgId, "billing.checkout");

    return result;
  }
}

