import type {
  FiscalProviderContext,
  FiscalProviderStatusResult,
} from "../types.js";

/**
 * Abstraction for fiscal providers (Fiskaly, future adapters).
 * POS never implements provider APIs directly — Cloud API owns credentials.
 */
export interface FiscalProvider {
  readonly key: string;
  readonly displayName: string;

  /** Placeholder until real integration — must not expose secrets. */
  getStatus(context: FiscalProviderContext): Promise<FiscalProviderStatusResult>;

  /** Future: onboard org with provider. Not implemented in Phase 1. */
  startSetup?(context: FiscalProviderContext): Promise<{ pending: true }>;
}
