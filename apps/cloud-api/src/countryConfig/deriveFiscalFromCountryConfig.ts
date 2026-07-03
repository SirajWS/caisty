import type {
  FiscalEnvironmentInternal,
  FiscalProviderInternal,
  FiscalStatusInternal,
  ReceiptModeInternal,
} from "../lib/businessProfileRules.js";
import { countryConfigService } from "./CountryConfigService.js";
import type { CountryConfigEntry } from "./types.js";

/** Initial fiscal status when country is set or reset (matches legacy applyCountryFiscalRules). */
export function initialFiscalStatusFromConfig(
  entry: CountryConfigEntry,
): FiscalStatusInternal {
  if (!entry.fiscalRequired) return "not_required";
  if (entry.fiscalProvider === "fiskaly") return "pending_setup";
  if (entry.status === "coming_soon") return "required_soon";
  return "required";
}

export function initialFiscalProviderFromConfig(
  entry: CountryConfigEntry,
): FiscalProviderInternal {
  if (entry.fiscalProvider === "fiskaly") return "fiskaly";
  return "none";
}

export function initialFiscalEnvironmentFromConfig(): FiscalEnvironmentInternal {
  return "not_configured";
}

export function receiptModeInternalFromConfig(
  entry: CountryConfigEntry,
): ReceiptModeInternal {
  switch (entry.receiptMode) {
    case "certified":
      return "certified_germany";
    case "standard_until_certified":
      return "standard_until_certified";
    default:
      return "standard";
  }
}

export function fiscalProfileKeyFromConfig(
  code: string,
  provider: FiscalProviderInternal,
): string {
  const entry = countryConfigService.getByCode(code);
  if (code === "DE" && provider === "fiskaly") return "de_fiskaly_api";
  if (entry.status === "coming_soon" && entry.fiscalRequired) {
    return `${code.toLowerCase()}_coming_soon`;
  }
  return "generic_standard";
}

export function providerTypeFromConfig(
  code: string,
  provider: FiscalProviderInternal,
): "none" | "api_service" | "coming_soon" {
  if (provider === "fiskaly") return "api_service";
  const entry = countryConfigService.getByCode(code);
  if (entry.status === "coming_soon" && entry.fiscalRequired) return "coming_soon";
  return "none";
}

export function fiscalRequiredFromConfig(
  code: string | null,
  provider: FiscalProviderInternal,
): boolean {
  if (!code) return false;
  const entry = countryConfigService.getByCode(code);
  if (entry.fiscalRequired) return true;
  if (provider === "fiskaly") return true;
  return false;
}
