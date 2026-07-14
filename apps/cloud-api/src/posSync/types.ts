export type PosSyncEventType =
  | "order"
  | "receipt"
  | "payment"
  | "receipt_event"
  | "shift";

export type PosSyncBatchMeta = {
  batchId: string;
  sequence?: number;
  sentAt?: string;
};

export type PosSyncOrderLinePayload = {
  lineIndex: number;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  taxRateBps?: number;
};

export type PosSyncOrderPayload = {
  localOrderId: string;
  status?: "open" | "closed" | "cancelled";
  totalCents: number;
  currency?: string;
  soldAt: string;
  lines?: PosSyncOrderLinePayload[];
};

export type PosSyncReceiptPayload = {
  localReceiptId: string;
  localOrderId?: string;
  receiptNumber?: string;
  netCents: number;
  taxCents?: number;
  grossCents: number;
  currency?: string;
  soldAt: string;
  fiscalStatus?: "pending" | "signed" | "failed";
};

export type PosSyncPaymentPayload = {
  localPaymentId: string;
  localOrderId?: string;
  localReceiptId?: string;
  method: string;
  amountCents: number;
  currency?: string;
  paidAt: string;
};

export type PosSyncReceiptEventPayload = {
  eventId: string;
  eventType: "created" | "printed" | "reprinted";
  localReceiptId: string;
  occurredAt: string;
  schemaVersion: number;
  actor?: string;
  payload?: Record<string, unknown>;
  receiptNumber?: string;
};

export type PosSyncShiftPayload = {
  localShiftId: string;
  status: "open" | "closed";
  cashier?: string;
  businessDate: string;
  startedAt: string;
  endedAt?: string | null;
  openingFloatMinor: number;
  closingFloatMinor?: number | null;
  previousClosingFloatMinor?: number | null;
  currency?: string;
  schemaVersion: number;
};

export type PosSyncEvent = {
  eventId: string;
  type: PosSyncEventType;
  payload:
    | PosSyncOrderPayload
    | PosSyncReceiptPayload
    | PosSyncPaymentPayload
    | PosSyncReceiptEventPayload
    | PosSyncShiftPayload;
};

export type PosSyncBatchRequest = {
  deviceId: string;
  licenseKey: string;
  batch: PosSyncBatchMeta;
  events: PosSyncEvent[];
  telemetry?: {
    appVersion?: string;
    offlineQueueCount?: number;
  };
};

export type PosSyncFailedEvent = {
  eventId: string;
  error: string;
  code: string;
};

export type PosSyncBatchResponse = {
  ok: true;
  batchId: string;
  posBatchId: string;
  status: "completed" | "duplicate_batch";
  accepted: string[];
  duplicate: string[];
  failed: PosSyncFailedEvent[];
  counts: {
    accepted: number;
    duplicate: number;
    failed: number;
  };
};

export type PosSyncErrorResponse = {
  ok: false;
  error: string;
  message?: string;
};

export const POS_SYNC_IDEMPOTENCY_SCOPE = "pos.sync.batch";
