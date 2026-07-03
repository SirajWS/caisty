import { beforeEach, describe, expect, it } from "vitest";

import { countryConfigService } from "../../countryConfig/CountryConfigService.js";
import { SEED_COUNTRY_CONFIG } from "../../countryConfig/__tests__/fixtures.js";
import {
  buildFiscalConfiguration,
  toSafePosFiscalConfig,
} from "../buildFiscalConfiguration.js";
import type { businessProfiles } from "../db/schema/businessProfiles.js";

type BusinessRow = typeof businessProfiles.$inferSelect;

function makeDeBusinessRow(): BusinessRow {
  const now = new Date();
  return {
    id: "00000000-0000-0000-0000-000000000001",
    orgId: "00000000-0000-0000-0000-000000000002",
    companyName: "Test GmbH",
    legalName: "Test GmbH",
    country: "DE",
    currency: "EUR",
    defaultLanguage: "de",
    vatId: null,
    taxId: null,
    fiscalStatus: "pending_setup",
    fiscalProvider: "fiskaly",
    fiscalEnvironment: "not_configured",
    complianceStatus: "incomplete",
    posConfigurationStatus: "not_ready",
    businessAddressJson: {
      street: "Musterstr. 1",
      city: "Berlin",
      zip: "10115",
      country: "DE",
    },
    createdAt: now,
    updatedAt: now,
    configVersion: 1,
  };
}

/** Contract keys for GET /pos/config → config (SafePosFiscalConfig). */
const SAFE_POS_CONFIG_KEYS = [
  "country",
  "currency",
  "fiscalRequired",
  "providerKey",
  "providerLabel",
  "providerType",
  "fiscalStatus",
  "receiptMode",
  "fiscalConfigurationLabel",
  "posDownloadAllowed",
  "fiscalNotice",
  "supportedExports",
  "mode",
] as const;

describe("buildFiscalConfiguration / SafePosFiscalConfig contract", () => {
  beforeEach(() => {
    countryConfigService.resetForTests();
    countryConfigService.seedForTests(SEED_COUNTRY_CONFIG);
  });

  it("DE business profile → stable SafePosFiscalConfig shape and values", () => {
    const snapshot = buildFiscalConfiguration({
      orgId: "org-1",
      businessRow: makeDeBusinessRow(),
    });
    const safe = toSafePosFiscalConfig(snapshot);

    expect(Object.keys(safe).sort()).toEqual([...SAFE_POS_CONFIG_KEYS].sort());

    expect(safe).toMatchObject({
      country: "DE",
      currency: "EUR",
      fiscalRequired: true,
      providerKey: "fiskaly",
      providerLabel: "Caisty Fiscal Germany powered by Fiskaly",
      providerType: "api_service",
      fiscalStatus: "pending_setup",
      receiptMode: "certified",
      fiscalConfigurationLabel: "Caisty Fiscal Germany powered by Fiskaly",
      posDownloadAllowed: true,
      supportedExports: ["DSFinV-K", "TSE TAR"],
      mode: "api_service",
    });
    expect(safe.fiscalNotice).toContain("Fiscal setup pending");
  });

  it("TN business profile → no fiscal, standard mode", () => {
    const row = {
      ...makeDeBusinessRow(),
      country: "TN",
      currency: "TND",
      fiscalStatus: "not_required",
      fiscalProvider: "none",
      businessAddressJson: { country: "TN" },
    };
    const safe = toSafePosFiscalConfig(
      buildFiscalConfiguration({ orgId: "org-1", businessRow: row }),
    );

    expect(safe.fiscalRequired).toBe(false);
    expect(safe.receiptMode).toBe("standard");
    expect(safe.providerKey).toBe("none");
    expect(safe.fiscalStatus).toBe("not_required");
    expect(safe.currency).toBe("TND");
  });
});
