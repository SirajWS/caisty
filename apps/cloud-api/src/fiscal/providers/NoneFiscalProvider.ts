import type { FiscalProvider } from "./FiscalProvider.js";
import type {
  FiscalProviderContext,
  FiscalProviderStatusResult,
} from "../types.js";

export class NoneFiscalProvider implements FiscalProvider {
  readonly key = "none";
  readonly displayName = "None";

  async getStatus(
    context: FiscalProviderContext,
  ): Promise<FiscalProviderStatusResult> {
    return {
      status: context.fiscalStatus,
      message: "Standard receipt mode — no fiscal API provider required.",
      pending: false,
    };
  }
}
