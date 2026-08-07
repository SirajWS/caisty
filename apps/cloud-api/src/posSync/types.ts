export type PosSyncEventType =
  | "order"
  | "receipt"
  | "payment"
  | "receipt_event"
  | "shift"
  | "channel";

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
  status?: string;
  totalCents: number;
  currency?: string;
  soldAt: string;
  lines?: PosSyncOrderLinePayload[];
  platform?: string;
  providerOrderId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  customerNote?: string;
  paymentStatus?: string;
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

export type PosSyncChannelPayload = {
  op: "upsert" | "delete";
  channelId: string;
  clientUpdatedAt: string;
  name?: string;
  slug?: string;
  enabled?: boolean;
  status?: string;
  provider?: string;
  mode?: string | null;
  storeId?: string | null;
  providerStoreId?: string;
  statusMapping?: Record<string, unknown>;
  statusMap?: Record<string, unknown>;
  notes?: string | null;
  logoDataUrl?: string | null;
  publicSettings?: Record<string, unknown>;
  createdAt?: string;
};

export type PosSyncEvent = {
  eventId: string;
  type: PosSyncEventType;
  payload:
    | PosSyncOrderPayload
    | PosSyncReceiptPayload
    | PosSyncPaymentPayload
    | PosSyncReceiptEventPayload
    | PosSyncShiftPayload
    | PosSyncChannelPayload;
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

export type PosPullEntityType =
  | "orders"
  | "receipts"
  | "payments"
  | "receiptEvents"
  | "shifts"
  | "channels";

export type PosPullCursors = Record<PosPullEntityType, string | null>;

export type PosPullRequest = {
  schemaVersion: 1;
  deviceId: string;
  licenseKey: string;
  cursors: PosPullCursors;
  limit: number;
};

export type PosPullOrderLineSnapshot = {
  id: string;
  lineIndex: number;
  productName: string | null;
  sku: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  taxRateBps: number | null;
  createdAt: string;
};

export type PosPullOrderSnapshot = {
  id: string;
  localOrderId: string;
  providerOrderId: string | null;
  platform: string | null;
  sourceDeviceId: string;
  status: string;
  paymentStatus: string | null;
  paymentMethod: string | null;
  paid?: boolean;
  paidAt?: string | null;
  totalCents: number;
  currency: string;
  soldAt: string;
  createdAt: string;
  updatedAt: string;
  lines: PosPullOrderLineSnapshot[];
};

export type PosPullReceiptSnapshot = {
  id: string;
  localReceiptId: string;
  localOrderId: string | null;
  localPaymentId: string | null;
  sourceDeviceId: string;
  receiptNumber: string | null;
  netCents: number;
  taxCents: number;
  grossCents: number;
  currency: string;
  fiscalStatus: string;
  status: string;
  soldAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PosPullPaymentSnapshot = {
  id: string;
  localPaymentId: string;
  localOrderId: string | null;
  localReceiptId: string | null;
  sourceDeviceId: string;
  method: string;
  amountCents: number;
  currency: string;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PosPullReceiptEventSnapshot = {
  id: string;
  eventId: string;
  receiptId: string;
  localReceiptId: string | null;
  sourceDeviceId: string;
  eventType: string;
  occurredAt: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type PosPullShiftSnapshot = {
  id: string;
  localShiftId: string;
  sourceDeviceId: string;
  cashier: string | null;
  status: string;
  openingFloatMinor: number;
  closingFloatMinor: number | null;
  previousClosingFloatMinor: number | null;
  currency: string;
  businessDate: string;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PosPullChannelSnapshot = {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  provider: string | null;
  mode: string | null;
  storeId: string | null;
  statusMapping: Record<string, unknown>;
  notes: string | null;
  logoDataUrl: string | null;
  publicSettings: Record<string, unknown>;
  deleted: boolean;
  deletedAt: string | null;
  /** null for portal-created channels; UUID for POS-created channels */
  sourceDeviceId: string | null;
  clientUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PosPullResponse = {
  ok: true;
  schemaVersion: 1;
  serverTime: string;
  scope: {
    orgId: string;
    deviceId: string;
  };
  changes: {
    orders: PosPullOrderSnapshot[];
    receipts: PosPullReceiptSnapshot[];
    payments: PosPullPaymentSnapshot[];
    receiptEvents: PosPullReceiptEventSnapshot[];
    shifts: PosPullShiftSnapshot[];
    channels: PosPullChannelSnapshot[];
  };
  nextCursors: PosPullCursors;
  hasMore: Record<PosPullEntityType, boolean>;
};
