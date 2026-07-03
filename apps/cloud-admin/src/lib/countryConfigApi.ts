import { apiGet } from "./api";

export type CountryConfigPublic = {
  code: string;
  nameDe: string;
  nameEn: string;
  currency: string;
  allowedCurrencies: string[];
  fiscalRequired: boolean;
  fiscalProvider: string | null;
  receiptMode: string;
  fiscalSurchargeCents: number;
  posDownloadAllowed: boolean;
  status: "active" | "coming_soon";
  sortOrder: number;
};

export type CountryConfigListResponse = {
  ok: boolean;
  items: CountryConfigPublic[];
};

export async function fetchCountryConfigList(): Promise<CountryConfigPublic[]> {
  const res = await apiGet<CountryConfigListResponse>("/country-config");
  return res.items ?? [];
}
