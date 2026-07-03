/**
 * Client cache for GET /country-config (single source of truth from cloud-api).
 */

export type CountryConfigReceiptMode =
  | "certified"
  | "standard"
  | "standard_until_certified";

export type CountryConfigStatus = "active" | "coming_soon";

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

const FALLBACK_ENTRY: CountryConfigPublic = {
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

const RAW_API_BASE =
  import.meta.env.VITE_CLOUD_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3333" : "https://api.caisty.com");

const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

let cache: CountryConfigPublic[] | null = null;
let loadPromise: Promise<CountryConfigPublic[]> | null = null;

export async function loadCountryConfig(): Promise<CountryConfigPublic[]> {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const res = await fetch(`${API_BASE}/country-config`);
    if (!res.ok) {
      throw new Error(`Failed to load country config: HTTP ${res.status}`);
    }
    const data = (await res.json()) as { ok?: boolean; items?: CountryConfigPublic[] };
    if (!data.ok || !Array.isArray(data.items)) {
      throw new Error("Invalid country config response");
    }
    cache = [...data.items].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code),
    );
    return cache;
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

export function getCountryConfigList(): CountryConfigPublic[] {
  return cache ? [...cache] : [];
}

export function isCountryConfigLoaded(): boolean {
  return cache !== null && cache.length > 0;
}

export function getCountryConfigByCode(code: string | null | undefined): CountryConfigPublic {
  if (!code?.trim()) {
    return { ...FALLBACK_ENTRY, code: "UNKNOWN" };
  }
  const upper = code.trim().toUpperCase();
  const hit = cache?.find((c) => c.code === upper);
  if (hit) return hit;
  return { ...FALLBACK_ENTRY, code: upper };
}

/** @internal Test helper */
export function resetCountryConfigCacheForTests(): void {
  cache = null;
  loadPromise = null;
}

/** @internal Test helper */
export function seedCountryConfigCacheForTests(items: CountryConfigPublic[]): void {
  cache = [...items];
}
