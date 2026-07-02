import {
  computeComplianceStatus,
  computePosConfigurationStatus,
  customerFacingFiscalStatus,
  defaultCurrencyForCountry,
  deriveReceiptMode,
  normalizeCountryCode,
  resolveFiscalFields,
  sanitizeBusinessAddress,
  type BusinessCountryCode,
  type FiscalStatusInternal,
} from "../lib/businessProfileRules.js";
import type { businessProfiles } from "../db/schema/businessProfiles.js";
import type {
  FiscalConfigurationSnapshot,
  FiscalProviderKey,
  FiscalProviderType,
  FiscalReceiptModeKey,
  SafePosFiscalConfig,
} from "./types.js";
import { getFiscalProvider } from "./providers/FiscalProviderFactory.js";

const EU_STRICT_SOON = new Set<BusinessCountryCode>([
  "AT",
  "FR",
  "IT",
  "ES",
  "PT",
  "NL",
  "BE",
]);

export function normalizeProviderKey(
  stored: string | null | undefined,
): FiscalProviderKey {
  if (!stored) return "none";
  const s = stored.trim().toLowerCase();
  if (s === "fiskaly" || s === "caisty_fiscal_germany_fiskaly") return "fiskaly";
  return "none";
}

function mapReceiptMode(
  country: BusinessCountryCode | null,
  fiscalStatus: FiscalStatusInternal,
): FiscalReceiptModeKey {
  const internal = deriveReceiptMode(country, fiscalStatus);
  if (internal === "certified_germany") return "certified";
  if (internal === "standard_until_certified") return "standard_until_certified";
  return "standard";
}

function resolveProviderType(
  country: BusinessCountryCode | null,
  provider: FiscalProviderKey,
): FiscalProviderType {
  if (provider === "fiskaly") return "api_service";
  if (country && EU_STRICT_SOON.has(country)) return "coming_soon";
  return "none";
}

function fiscalRequiredForCountry(
  country: BusinessCountryCode | null,
  provider: FiscalProviderKey,
): boolean {
  if (!country) return false;
  if (country === "DE" || provider === "fiskaly") return true;
  if (country && EU_STRICT_SOON.has(country)) return true;
  return false;
}

function fiscalProfileKey(
  country: BusinessCountryCode | null,
  provider: FiscalProviderKey,
): string {
  if (country === "DE" && provider === "fiskaly") return "de_fiskaly_api";
  if (country && EU_STRICT_SOON.has(country)) {
    return `${country.toLowerCase()}_coming_soon`;
  }
  return "generic_standard";
}

function fiscalConfigurationLabel(
  country: BusinessCountryCode | null,
  provider: FiscalProviderKey,
  providerType: FiscalProviderType,
): string {
  if (country === "DE" && provider === "fiskaly") {
    return "Caisty Fiscal Germany powered by Fiskaly";
  }
  if (providerType === "coming_soon" && country) {
    return "Fiscal configuration coming soon";
  }
  return "Standard receipt mode";
}

function providerLabel(
  country: BusinessCountryCode | null,
  provider: FiscalProviderKey,
): string {
  if (country === "DE" && provider === "fiskaly") {
    return "Caisty Fiscal Germany powered by Fiskaly";
  }
  if (provider === "fiskaly") return "Caisty Fiscal powered by Fiskaly";
  return "Not applicable";
}

function supportedExportsFor(
  country: BusinessCountryCode | null,
  provider: FiscalProviderKey,
): string[] {
  if (country === "DE" && provider === "fiskaly") {
    return ["DSFinV-K", "TSE TAR"];
  }
  return [];
}

function fiscalNoticeFor(
  country: BusinessCountryCode | null,
  fiscalStatus: FiscalStatusInternal,
  providerType: FiscalProviderType,
): string | null {
  if (country === "DE" && fiscalStatus === "pending_setup") {
    return "Fiscal setup pending. Caisty will complete cloud API onboarding — no manual configuration required.";
  }
  if (providerType === "coming_soon") {
    return "Certified fiscalization for this country is in preparation. Standard receipt mode applies until the cloud fiscal service is available.";
  }
  if (fiscalStatus === "active" && country === "DE") {
    return "Certified fiscalization is active via Caisty Cloud API service.";
  }
  return null;
}

function resolveMode(
  providerType: FiscalProviderType,
): "api_service" | "standard" | "coming_soon" {
  if (providerType === "api_service") return "api_service";
  if (providerType === "coming_soon") return "coming_soon";
  return "standard";
}

export function buildFiscalConfiguration(input: {
  orgId: string;
  businessRow: typeof businessProfiles.$inferSelect;
}): FiscalConfigurationSnapshot {
  const { orgId, businessRow } = input;
  const country = normalizeCountryCode(businessRow.country);
  const fiscal = resolveFiscalFields(
    country,
    businessRow.fiscalStatus,
    businessRow.fiscalProvider,
  );
  const provider = normalizeProviderKey(fiscal.fiscalProvider);
  const providerType = resolveProviderType(country, provider);
  const fiscalStatus = fiscal.fiscalStatus;
  const receiptMode = mapReceiptMode(country, fiscalStatus);
  const businessAddress = sanitizeBusinessAddress(
    businessRow.businessAddressJson,
    businessRow.country,
  );
  const complianceStatus = computeComplianceStatus({
    country,
    companyName: businessRow.companyName,
    legalName: businessRow.legalName,
    businessAddress,
    fiscalStatus,
  });
  const posConfigurationStatus = computePosConfigurationStatus({
    country,
    fiscalStatus,
    complianceStatus,
  });

  const fiscalRequired = fiscalRequiredForCountry(country, provider);
  const profileKey = fiscalProfileKey(country, provider);
  const configLabel = fiscalConfigurationLabel(country, provider, providerType);

  return {
    orgId,
    country: businessRow.country ?? null,
    currency: businessRow.currency ?? defaultCurrencyForCountry(country),
    fiscalRequired,
    provider,
    providerType,
    providerName: provider === "fiskaly" ? "Fiskaly" : null,
    providerLabel: providerLabel(country, provider),
    fiscalStatus,
    fiscalStatusCustomer: customerFacingFiscalStatus(fiscalStatus),
    fiscalEnvironment: fiscal.fiscalEnvironment,
    receiptMode,
    fiscalProfileKey: profileKey,
    fiscalConfigurationLabel: configLabel,
    supportedExports: supportedExportsFor(country, provider),
    posDownloadAllowed: true,
    posConfigurationStatus,
    fiscalNotice: fiscalNoticeFor(country, fiscalStatus, providerType),
    mode: resolveMode(providerType),
  };
}

export function toSafePosFiscalConfig(
  snapshot: FiscalConfigurationSnapshot,
): SafePosFiscalConfig {
  return {
    country: snapshot.country,
    currency: snapshot.currency,
    fiscalRequired: snapshot.fiscalRequired,
    providerKey: snapshot.provider,
    providerLabel: snapshot.providerLabel,
    providerType: snapshot.providerType,
    fiscalStatus: snapshot.fiscalStatusCustomer,
    receiptMode: snapshot.receiptMode,
    fiscalConfigurationLabel: snapshot.fiscalConfigurationLabel,
    posDownloadAllowed: snapshot.posDownloadAllowed,
    fiscalNotice: snapshot.fiscalNotice,
    supportedExports: snapshot.supportedExports,
    mode: snapshot.mode,
  };
}

export async function enrichWithProviderStatus(
  snapshot: FiscalConfigurationSnapshot,
): Promise<FiscalConfigurationSnapshot> {
  const provider = getFiscalProvider(snapshot.provider);
  const result = await provider.getStatus({
    orgId: snapshot.orgId,
    country: snapshot.country,
    fiscalStatus: snapshot.fiscalStatus,
    fiscalEnvironment: snapshot.fiscalEnvironment,
  });

  if (result.pending && snapshot.fiscalStatus !== "active") {
    return {
      ...snapshot,
      fiscalStatus: result.status,
      fiscalStatusCustomer: customerFacingFiscalStatus(result.status),
      fiscalNotice: result.message,
    };
  }

  return snapshot;
}
