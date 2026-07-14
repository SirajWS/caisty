import type {
  PortalCustomer,
  PortalReceiptDetailResponse,
  PortalReceiptsResponse,
} from "../portalApi";

import type { PortalTranslations } from "../translations/portal";

export type ReceiptsData = {
  customer: PortalCustomer;
  page: PortalReceiptsResponse | null;
  detail: PortalReceiptDetailResponse | null;
  detailReceiptId: string | null;
  detailLoading: boolean;
  loading: boolean;
  error: boolean;
  lastSyncedAt: Date | null;
};

export type ReceiptsKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type ReceiptPaymentCard = {
  id: "cash" | "card" | "voucher" | "other";
  label: string;
  value: string;
  tone: "ok" | "unknown";
};

export type ReceiptTableRow = {
  id: string;
  receiptNumber: string;
  date: string;
  time: string;
  cashier: string;
  payment: string;
  amount: string;
  status: string;
  statusRaw: string;
  fiscal: string;
  printCount: string;
  lastEvent: string;
  source: PortalReceiptsResponse["receipts"][number];
};

export type ReceiptEventRow = {
  id: string;
  time: string;
  label: string;
  actor: string;
  kind: "created" | "printed" | "reprinted" | "other";
};

export type ReceiptsDerivedState = {
  summary: ReceiptsKpi[];
  payments: ReceiptPaymentCard[];
  receipts: ReceiptTableRow[];
  events: ReceiptEventRow[];
  printStats: {
    originalPrint: string;
    reprintCount: string;
    lastPrintTime: string;
  };
  detailReceipt: PortalReceiptDetailResponse["receipt"] | null;
  hasReceipts: boolean;
};

export type DeriveReceiptsInput = {
  data: ReceiptsData;
  t: PortalTranslations;
  locale: string;
};
