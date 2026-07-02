import type { FiscalProvider } from "./FiscalProvider.js";
import type {
  FiscalProviderContext,
  FiscalProviderStatusResult,
} from "../types.js";

/**
 * Placeholder for Fiskaly API-service integration (Germany TSE).
 * Credentials and TSS lifecycle remain server-side only.
 */
export class FiskalyFiscalProvider implements FiscalProvider {
  readonly key = "fiskaly";
  readonly displayName = "Fiskaly";

  async getStatus(
    context: FiscalProviderContext,
  ): Promise<FiscalProviderStatusResult> {
    if (context.fiscalStatus === "active") {
      return {
        status: "active",
        message: "Caisty Fiscal Germany is active via cloud API service.",
        pending: false,
      };
    }

    if (context.fiscalStatus === "error") {
      return {
        status: "error",
        message: "Fiscal setup requires attention. Contact Caisty support.",
        pending: false,
      };
    }

    return {
      status: "pending_setup",
      message:
        "Cloud fiscal setup is pending. POS will use certified mode once Caisty completes API onboarding.",
      pending: true,
    };
  }

  async startSetup(): Promise<{ pending: true }> {
    throw new Error("Fiskaly setup is not implemented yet.");
  }
}
