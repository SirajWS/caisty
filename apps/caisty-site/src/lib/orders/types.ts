import type { PosHubTone } from "../posHub/types";
import type { DashboardData } from "../dashboard/types";

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

export type PosReceiptRow = {
  id: string;
  receiptNumber: string;
  time: string;
  customer: string;
  payment: string;
  fiscal: string;
  amount: string;
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

export type DeriveOrdersInput = {
  data: DashboardData;
  t: import("../translations/portal").PortalTranslations;
};
