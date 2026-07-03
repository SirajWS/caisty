import { beforeEach, describe, expect, it } from "vitest";

import { countryConfigService } from "../CountryConfigService.js";
import {
  applyCountryFiscalRules,
  defaultCurrencyForCountry,
} from "../../lib/businessProfileRules.js";
import { SEED_COUNTRY_CONFIG } from "./fixtures.js";

describe("CountryConfigService", () => {
  beforeEach(() => {
    countryConfigService.resetForTests();
    countryConfigService.seedForTests(SEED_COUNTRY_CONFIG);
  });

  it("DE → fiscal required, certified receipt mode, EUR, surcharge 500", () => {
    const de = countryConfigService.getByCode("DE");
    expect(de.fiscalRequired).toBe(true);
    expect(de.fiscalProvider).toBe("fiskaly");
    expect(de.receiptMode).toBe("certified");
    expect(de.currency).toBe("EUR");
    expect(countryConfigService.getFiscalSurcharge("DE")).toBe(500);
    expect(countryConfigService.isFiscalRequired("DE")).toBe(true);
  });

  it("TN/MA/DZ/LY → no fiscal, standard receipt, local currency", () => {
    for (const code of ["TN", "MA", "DZ", "LY"] as const) {
      const entry = countryConfigService.getByCode(code);
      expect(entry.fiscalRequired).toBe(false);
      expect(entry.receiptMode).toBe("standard");
      expect(countryConfigService.isFiscalRequired(code)).toBe(false);
    }
    expect(countryConfigService.getCurrency("TN")).toBe("TND");
    expect(countryConfigService.getCurrency("MA")).toBe("MAD");
    expect(countryConfigService.getCurrency("DZ")).toBe("DZD");
    expect(countryConfigService.getCurrency("LY")).toBe("LYD");
  });

  it("unknown country → fallback (no fiscal, standard, EUR)", () => {
    const warnCalls: unknown[] = [];
    const logger = { warn: (...args: unknown[]) => warnCalls.push(args) };

    const entry = countryConfigService.getByCode("ZZ", logger as never);
    expect(entry.fiscalRequired).toBe(false);
    expect(entry.receiptMode).toBe("standard");
    expect(entry.currency).toBe("EUR");
    expect(entry.code).toBe("ZZ");
    expect(warnCalls.length).toBe(1);
    expect(countryConfigService.isKnownCode("ZZ")).toBe(false);
  });

  it("applyCountryFiscalRules uses config (DE pending_setup + fiskaly)", () => {
    const rules = applyCountryFiscalRules("DE");
    expect(rules.fiscalStatus).toBe("pending_setup");
    expect(rules.fiscalProvider).toBe("fiskaly");
  });

  it("applyCountryFiscalRules for TN → not_required", () => {
    const rules = applyCountryFiscalRules("TN");
    expect(rules.fiscalStatus).toBe("not_required");
    expect(rules.fiscalProvider).toBe("none");
  });

  it("defaultCurrencyForCountry reads from config", () => {
    expect(defaultCurrencyForCountry("DE")).toBe("EUR");
    expect(defaultCurrencyForCountry("TN")).toBe("TND");
  });
});
