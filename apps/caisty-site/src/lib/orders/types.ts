import type { PosHubTone } from "../posHub/types";
import type {
  PortalCustomer,
  PortalOrderRecord,
  PortalOrdersResponse,
  PortalReceiptRecord,
} from "../portalApi";

export type OrdersKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type PosOrderRow = {
  id: string;
  time: string;
  orderNumber: string;
  status: string;
  payment: string;
  amount: string;
  cashier: string;
  device: string;
};

export type PosReceiptLineRow = {
  product: string;
  quantity: string;
  unitPrice: string;
  total: string;
};

export type PosReceiptRow = {
  id: string;
  receiptNumber: string;
  time: string;
  customer: string;
  payment: string;
  fiscal: string;
  amount: string;
  items: PosReceiptLineRow[];
  /** Raw API record for PDF export and detail view. */
  source: PortalReceiptRecord;
};

export type PaymentMethodCard = {
  id: string;
  label: string;
  value: string;
  tone: PosHubTone;
};

export type BusinessEvent = {
  id: string;
  kind:
    | "receipt_created"
    | "refund"
    | "shift_opened"
    | "shift_closed"
    | "drawer_opened"
    | "printer_offline"
    | "fiscal_signed"
    | "cloud_synced"
    | "device_connected"
    | "pos_connected";
  label: string;
  at: string;
};

export type OrdersDerivedState = {
  summary: OrdersKpi[];
  orders: PosOrderRow[];
  receipts: PosReceiptRow[];
  payments: PaymentMethodCard[];
  hasSalesData: boolean;
};

export type OrdersData = {
  customer: PortalCustomer;
  sales: PortalOrdersResponse | null;
  loading: boolean;
  error: boolean;
  lastSyncedAt: Date | null;
};

export type DeriveOrdersInput = {
  data: OrdersData;
  t: import("../translations/portal").PortalTranslations;
  locale: string;
};

export type { PortalOrderRecord, PortalReceiptRecord, PortalOrdersResponse };
