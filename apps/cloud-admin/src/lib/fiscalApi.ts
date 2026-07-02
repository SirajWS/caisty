import { apiGet } from "./api";

export type AdminFiscalOverviewItem = {
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  orgId: string;
  country: string | null;
  currency: string;
  fiscalRequired: boolean;
  provider: string;
  providerType: string;
  providerName: string | null;
  providerLabel: string;
  fiscalConfigurationLabel: string;
  fiscalStatus: string;
  fiscalEnvironment: string;
  receiptMode: string;
  fiscalProfileKey: string;
  posConfigurationStatus: string;
  posDownloadAllowed: boolean;
  supportedExports: string[];
  lastSyncAt: string | null;
  actions: {
    startSetup: boolean;
    markActive: boolean;
    markPending: boolean;
    viewLogs: boolean;
  };
};

export type FiscalOverviewSummary = {
  totalProfiles: number;
  germanyFiskalyPending: number;
  activeSetups: number;
  comingSoonCountries: number;
  standardReceiptMode: number;
};

export type AdminFiscalOverviewResponse = {
  ok: boolean;
  items: AdminFiscalOverviewItem[];
  total: number;
  summary: FiscalOverviewSummary;
};

export type AdminCustomerFiscalResponse = {
  ok: boolean;
  fiscal?: AdminFiscalOverviewItem & {
    fiscalNotice: string | null;
    mode: string;
  };
};

export async function fetchFiscalOverview(limit = 500): Promise<AdminFiscalOverviewResponse> {
  return apiGet<AdminFiscalOverviewResponse>(
    `/admin/fiscal/overview?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function fetchCustomerFiscal(
  customerId: string,
): Promise<AdminCustomerFiscalResponse> {
  return apiGet<AdminCustomerFiscalResponse>(
    `/admin/fiscal/customers/${encodeURIComponent(customerId)}`,
  );
}
