import { asc } from "drizzle-orm";
import type { FastifyBaseLogger } from "fastify";

import { db } from "../db/client.js";
import { countryConfig, type CountryConfigRow } from "../db/schema/countryConfig.js";
import {
  FALLBACK_COUNTRY_CONFIG,
  type CountryConfigEntry,
  type CountryConfigReceiptMode,
  type CountryConfigStatus,
} from "./types.js";

function rowToEntry(row: CountryConfigRow): CountryConfigEntry {
  const allowed = Array.isArray(row.allowedCurrenciesJson)
    ? row.allowedCurrenciesJson.map((c) => String(c).toUpperCase())
    : [row.currency];

  return {
    code: row.code,
    nameDe: row.nameDe,
    nameEn: row.nameEn,
    currency: row.currency,
    allowedCurrencies: allowed,
    fiscalRequired: row.fiscalRequired,
    fiscalProvider: row.fiscalProvider,
    receiptMode: row.receiptMode as CountryConfigReceiptMode,
    fiscalSurchargeCents: row.fiscalSurchargeCents,
    posDownloadAllowed: row.posDownloadAllowed,
    status: row.status as CountryConfigStatus,
    sortOrder: row.sortOrder,
  };
}

class CountryConfigServiceImpl {
  private cache = new Map<string, CountryConfigEntry>();
  private listCache: CountryConfigEntry[] | null = null;
  private warmed = false;

  /** Load all rows from DB into memory (idempotent). */
  async warmCache(logger?: FastifyBaseLogger): Promise<void> {
    const rows = await db
      .select()
      .from(countryConfig)
      .orderBy(asc(countryConfig.sortOrder), asc(countryConfig.code));

    this.cache.clear();
    for (const row of rows) {
      const entry = rowToEntry(row);
      this.cache.set(entry.code.toUpperCase(), entry);
    }
    this.listCache = [...this.cache.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code),
    );
    this.warmed = true;

    if (rows.length === 0) {
      logger?.warn(
        "country_config table is empty — all lookups will use fallback defaults",
      );
    }
  }

  /** Test helper: inject rows without DB. */
  seedForTests(rows: CountryConfigEntry[]): void {
    this.cache.clear();
    for (const row of rows) {
      this.cache.set(row.code.toUpperCase(), row);
    }
    this.listCache = [...this.cache.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code),
    );
    this.warmed = true;
  }

  resetForTests(): void {
    this.cache.clear();
    this.listCache = null;
    this.warmed = false;
  }

  isWarmed(): boolean {
    return this.warmed;
  }

  listAll(): CountryConfigEntry[] {
    return this.listCache ? [...this.listCache] : [];
  }

  getSupportedCodes(): string[] {
    return this.listAll().map((e) => e.code);
  }

  getByCode(code: string | null | undefined, logger?: FastifyBaseLogger): CountryConfigEntry {
    if (!code?.trim()) {
      return { ...FALLBACK_COUNTRY_CONFIG, code: "UNKNOWN" };
    }

    const upper = code.trim().toUpperCase();
    const hit = this.cache.get(upper);
    if (hit) return hit;

    logger?.warn({ countryCode: upper }, "country_config: unknown country code, using fallback");
    return {
      ...FALLBACK_COUNTRY_CONFIG,
      code: upper,
    };
  }

  isFiscalRequired(code: string | null | undefined, logger?: FastifyBaseLogger): boolean {
    return this.getByCode(code, logger).fiscalRequired;
  }

  getCurrency(code: string | null | undefined, logger?: FastifyBaseLogger): string {
    return this.getByCode(code, logger).currency;
  }

  getReceiptMode(
    code: string | null | undefined,
    logger?: FastifyBaseLogger,
  ): CountryConfigReceiptMode {
    return this.getByCode(code, logger).receiptMode;
  }

  getFiscalSurcharge(code: string | null | undefined, logger?: FastifyBaseLogger): number {
    return this.getByCode(code, logger).fiscalSurchargeCents;
  }

  getAllowedCurrencies(code: string | null | undefined, logger?: FastifyBaseLogger): string[] {
    return this.getByCode(code, logger).allowedCurrencies;
  }

  isCurrencyAllowed(
    code: string | null | undefined,
    currency: string,
    logger?: FastifyBaseLogger,
  ): boolean {
    const cur = currency.trim().toUpperCase();
    return this.getAllowedCurrencies(code, logger).includes(cur);
  }

  isKnownCode(code: string | null | undefined): boolean {
    if (!code?.trim()) return false;
    return this.cache.has(code.trim().toUpperCase());
  }
}

export const countryConfigService = new CountryConfigServiceImpl();
