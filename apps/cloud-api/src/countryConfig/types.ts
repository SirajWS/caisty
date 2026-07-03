export type CountryConfigStatus = "active" | "coming_soon";

/** Stored receipt mode — includes legacy `standard_until_certified` for EU coming-soon countries. */
export type CountryConfigReceiptMode =
  | "certified"
  | "standard"
  | "standard_until_certified";

export type CountryConfigEntry = {
  code: string;
  nameDe: string;
  nameEn: string;
  currency: string;
  allowedCurrencies: string[];
  fiscalRequired: boolean;
  fiscalProvider: string | null;
  receiptMode: CountryConfigReceiptMode;
  fiscalSurchargeCents: number;
  posDownloadAllowed: boolean;
  status: CountryConfigStatus;
  sortOrder: number;
};

/** Public API DTO (GET /country-config). */
export type CountryConfigPublic = {
  code: string;
  nameDe: string;
  nameEn: string;
  currency: string;
  allowedCurrencies: string[];
  fiscalRequired: boolean;
  fiscalProvider: string | null;
  receiptMode: CountryConfigReceiptMode;
  fiscalSurchargeCents: number;
  posDownloadAllowed: boolean;
  status: CountryConfigStatus;
  sortOrder: number;
};

export function toCountryConfigPublic(entry: CountryConfigEntry): CountryConfigPublic {
  return {
    code: entry.code,
    nameDe: entry.nameDe,
    nameEn: entry.nameEn,
    currency: entry.currency,
    allowedCurrencies: entry.allowedCurrencies,
    fiscalRequired: entry.fiscalRequired,
    fiscalProvider: entry.fiscalProvider,
    receiptMode: entry.receiptMode,
    fiscalSurchargeCents: entry.fiscalSurchargeCents,
    posDownloadAllowed: entry.posDownloadAllowed,
    status: entry.status,
    sortOrder: entry.sortOrder,
  };
}

export const FALLBACK_COUNTRY_CONFIG: CountryConfigEntry = {
  code: "UNKNOWN",
  nameDe: "Unbekannt",
  nameEn: "Unknown",
  currency: "EUR",
  allowedCurrencies: ["EUR"],
  fiscalRequired: false,
  fiscalProvider: null,
  receiptMode: "standard",
  fiscalSurchargeCents: 0,
  posDownloadAllowed: true,
  status: "active",
  sortOrder: 9999,
};
