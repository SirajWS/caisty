import { beforeEach, describe, expect, it } from "vitest";

import { countryConfigService } from "../../countryConfig/CountryConfigService.js";
import { SEED_COUNTRY_CONFIG } from "../../countryConfig/__tests__/fixtures.js";
import {
  buildFiscalConfiguration,
  toSafePosFiscalConfig,
} from "../buildFiscalConfiguration.js";
import {
  buildPosSyncConfig,
  nextConfigVersion,
} from "../buildPosSyncConfig.js";
import type { businessProfiles } from "../../db/schema/businessProfiles.js";
import type { devices } from "../../db/schema/devices.js";
import type { licenses } from "../../db/schema/licenses.js";

type BusinessRow = typeof businessProfiles.$inferSelect;

function makeBusinessRow(
  overrides: Partial<BusinessRow> = {},
): BusinessRow {
  const now = new Date("2026-06-01T12:00:00.000Z");
  return {
    id: "00000000-0000-0000-0000-000000000001",
    orgId: "00000000-0000-0000-0000-000000000002",
    companyName: "Test GmbH",
    legalName: "Test GmbH",
    country: "DE",
    currency: "EUR",
    defaultLanguage: "de",
    vatId: "DE123",
    taxId: "TAX-1",
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
    configVersion: 3,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeLicense(): typeof licenses.$inferSelect {
  const now = new Date("2026-06-01T12:00:00.000Z");
  return {
    id: "lic-1",
    orgId: "org-1",
    customerId: "cust-1",
    subscriptionId: null,
    key: "CSTY-TEST-KEY",
    plan: "starter",
    maxDevices: 2,
    status: "active",
    validFrom: now,
    validUntil: null,
    createdAt: now,
    updatedAt: now,
  };
}

function makeDevice(): typeof devices.$inferSelect {
  return {
    id: "00000000-0000-0000-0000-000000000099",
    orgId: "org-1",
    customerId: null,
    name: "Kasse 1",
    type: "pos",
    status: "active",
    lastSeenAt: null,
    createdAt: new Date("2026-06-01T12:00:00.000Z"),
    licenseId: "lic-1",
    fingerprint: "fp-abc",
    lastHeartbeatAt: new Date("2026-06-01T13:00:00.000Z"),
    appVersion: null,
    lastSalesSyncAt: null,
    offlineQueueCount: 0,
  };
}

const POS_SYNC_BUSINESS_KEYS = [
  "companyName",
  "legalName",
  "country",
  "currency",
  "defaultLanguage",
  "street",
  "city",
  "postalCode",
  "vatId",
  "taxNumber",
  "updatedAt",
] as const;

const POS_SYNC_FISCAL_KEYS = [
  "fiscalRequired",
  "provider",
  "receiptMode",
  "status",
  "countryRule",
] as const;

describe("buildPosSyncConfig / GET /pos/config contract", () => {
  beforeEach(() => {
    countryConfigService.resetForTests();
    countryConfigService.seedForTests(SEED_COUNTRY_CONFIG);
  });

  it("TN business → TND + fiscalRequired=false + standard receipts", () => {
    const row = makeBusinessRow({
      country: "TN",
      currency: "TND",
      fiscalStatus: "not_required",
      fiscalProvider: "none",
      businessAddressJson: {
        street: "Rue 1",
        city: "Tunis",
        zip: "1000",
        country: "TN",
      },
    });
    const fiscalSnapshot = buildFiscalConfiguration({
      orgId: row.orgId,
      businessRow: row,
    });
    const payload = buildPosSyncConfig({
      businessRow: row,
      fiscalSnapshot,
      license: makeLicense(),
      device: makeDevice(),
    });

    expect(Object.keys(payload.business).sort()).toEqual(
      [...POS_SYNC_BUSINESS_KEYS].sort(),
    );
    expect(Object.keys(payload.fiscal).sort()).toEqual(
      [...POS_SYNC_FISCAL_KEYS].sort(),
    );

    expect(payload.business.country).toBe("TN");
    expect(payload.business.currency).toBe("TND");
    expect(payload.fiscal.fiscalRequired).toBe(false);
    expect(payload.fiscal.receiptMode).toBe("standard");
    expect(payload.fiscal.provider).toBe("none");
    expect(payload.fiscal.status).toBe("not_required");
    expect(payload.sync.configVersion).toBe(3);
  });

  it("DE business → EUR + fiscalRequired=true + fiskaly + certified", () => {
    const row = makeBusinessRow({ country: "DE", currency: "EUR" });
    const fiscalSnapshot = buildFiscalConfiguration({
      orgId: row.orgId,
      businessRow: row,
    });
    const payload = buildPosSyncConfig({
      businessRow: row,
      fiscalSnapshot,
      license: makeLicense(),
      device: makeDevice(),
    });

    expect(payload.business.currency).toBe("EUR");
    expect(payload.fiscal.fiscalRequired).toBe(true);
    expect(payload.fiscal.provider).toBe("fiskaly");
    expect(payload.fiscal.receiptMode).toBe("certified");
    expect(payload.fiscal.countryRule).toBe("de_fiskaly_api");
    expect(payload.business.vatId).toBe("DE123");
    expect(payload.business.taxNumber).toBe("TAX-1");
    expect(payload.business.postalCode).toBe("10115");
  });

  it("country change TN → DE updates currency and fiscal in snapshot", () => {
    const tnRow = makeBusinessRow({
      country: "TN",
      currency: "TND",
      fiscalStatus: "not_required",
      fiscalProvider: "none",
    });
    const tnSnapshot = buildFiscalConfiguration({
      orgId: tnRow.orgId,
      businessRow: tnRow,
    });
    expect(tnSnapshot.currency).toBe("TND");
    expect(tnSnapshot.fiscalRequired).toBe(false);

    const deRow = makeBusinessRow({
      country: "DE",
      currency: "EUR",
      fiscalStatus: "pending_setup",
      fiscalProvider: "fiskaly",
      configVersion: 4,
    });
    const deSnapshot = buildFiscalConfiguration({
      orgId: deRow.orgId,
      businessRow: deRow,
    });
    const payload = buildPosSyncConfig({
      businessRow: deRow,
      fiscalSnapshot: deSnapshot,
      license: makeLicense(),
      device: makeDevice(),
    });

    expect(deSnapshot.currency).toBe("EUR");
    expect(deSnapshot.fiscalRequired).toBe(true);
    expect(payload.business.currency).toBe("EUR");
    expect(payload.fiscal.fiscalRequired).toBe(true);
    expect(payload.sync.configVersion).toBe(4);
  });

  it("nextConfigVersion increments from current value", () => {
    expect(nextConfigVersion(1)).toBe(2);
    expect(nextConfigVersion(7)).toBe(8);
    expect(nextConfigVersion(null)).toBe(2);
  });

  it("legacy SafePosFiscalConfig shape remains available", () => {
    const row = makeBusinessRow();
    const snapshot = buildFiscalConfiguration({
      orgId: row.orgId,
      businessRow: row,
    });
    const safe = toSafePosFiscalConfig(snapshot);
    expect(safe.fiscalRequired).toBe(true);
    expect(safe.country).toBe("DE");
  });
});
