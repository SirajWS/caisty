import {
  sanitizeBusinessAddress,
  normalizeCountryCode,
} from "../lib/businessProfileRules.js";
import type { businessProfiles } from "../db/schema/businessProfiles.js";
import type { devices } from "../db/schema/devices.js";
import type { licenses } from "../db/schema/licenses.js";
import type { FiscalConfigurationSnapshot } from "./types.js";

export type PosSyncBusiness = {
  companyName: string;
  legalName: string;
  country: string | null;
  currency: string;
  defaultLanguage: string;
  street: string;
  city: string;
  postalCode: string;
  vatId: string;
  taxNumber: string;
  updatedAt: string;
};

export type PosSyncFiscal = {
  fiscalRequired: boolean;
  provider: string;
  receiptMode: string;
  status: string;
  countryRule: string;
};

export type PosSyncLicense = {
  id: string;
  key: string;
  plan: string;
  status: string;
  maxDevices: number;
  validUntil: string | null;
};

export type PosSyncDevice = {
  id: string;
  name: string;
  status: string;
  fingerprint: string | null;
  lastHeartbeatAt: string | null;
};

export type PosSyncMeta = {
  configVersion: number;
  updatedAt: string;
};

export type PosSyncConfigPayload = {
  orgId: string;
  business: PosSyncBusiness;
  fiscal: PosSyncFiscal;
  license: PosSyncLicense;
  device: PosSyncDevice;
  sync: PosSyncMeta;
};

type BusinessRow = typeof businessProfiles.$inferSelect;
type LicenseRow = typeof licenses.$inferSelect;
type DeviceRow = typeof devices.$inferSelect;

function iso(value: Date | string | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

export function buildPosSyncConfig(input: {
  businessRow: BusinessRow;
  fiscalSnapshot: FiscalConfigurationSnapshot;
  license: LicenseRow;
  device: DeviceRow;
  orgName?: string | null;
  resolvedOrgId: string;
}): PosSyncConfigPayload {
  const { businessRow, fiscalSnapshot, license, device, resolvedOrgId } = input;
  const address = sanitizeBusinessAddress(
    businessRow.businessAddressJson,
    businessRow.country,
  );

  const configVersion = businessRow.configVersion ?? 1;
  const businessUpdatedAt = businessRow.updatedAt;

  return {
    orgId: resolvedOrgId,
    business: {
      companyName: businessRow.companyName?.trim() || input.orgName?.trim() || "",
      legalName: businessRow.legalName?.trim() || "",
      country: businessRow.country ?? null,
      currency: fiscalSnapshot.currency,
      defaultLanguage: businessRow.defaultLanguage ?? "en",
      street: address.street?.trim() || "",
      city: address.city?.trim() || "",
      postalCode: address.zip?.trim() || "",
      vatId: businessRow.vatId?.trim() || "",
      taxNumber: businessRow.taxId?.trim() || "",
      updatedAt: iso(businessUpdatedAt),
    },
    fiscal: {
      fiscalRequired: fiscalSnapshot.fiscalRequired,
      provider: fiscalSnapshot.provider,
      receiptMode: fiscalSnapshot.receiptMode,
      status: fiscalSnapshot.fiscalStatusCustomer,
      countryRule: fiscalSnapshot.fiscalProfileKey,
    },
    license: {
      id: license.id,
      key: license.key,
      plan: license.plan,
      status: license.status,
      maxDevices: license.maxDevices === null ? null : (license.maxDevices ?? 1),
      unlimitedDevices: license.maxDevices === null,
      validUntil: license.validUntil ? iso(license.validUntil) : null,
    },
    device: {
      id: String(device.id),
      name: device.name,
      status: device.status,
      fingerprint: device.fingerprint ?? null,
      lastHeartbeatAt: device.lastHeartbeatAt
        ? iso(device.lastHeartbeatAt)
        : null,
    },
    sync: {
      configVersion,
      updatedAt: iso(businessUpdatedAt),
    },
  };
}

/** Bump helper for PATCH — always increment version on business save. */
export function nextConfigVersion(current: number | null | undefined): number {
  const base = typeof current === "number" && current > 0 ? current : 1;
  return base + 1;
}

export function countryRuleLabel(country: string | null | undefined): string {
  const code = normalizeCountryCode(country ?? null);
  if (!code) return "generic_standard";
  if (code === "DE") return "de_fiskaly_api";
  if (code === "TN") return "generic_standard";
  return "generic_standard";
}
