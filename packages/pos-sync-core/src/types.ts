export const PULL_ENTITY_TYPES = [
  "orders",
  "receipts",
  "payments",
  "receiptEvents",
  "shifts",
] as const;

export type PullEntityType = (typeof PULL_ENTITY_TYPES)[number];

export type PullCursors = Record<PullEntityType, string | null>;

export const EMPTY_PULL_CURSORS: PullCursors = {
  orders: null,
  receipts: null,
  payments: null,
  receiptEvents: null,
  shifts: null,
};

export const PULL_SCHEMA_VERSION = 1 as const;
export const DEFAULT_PULL_LIMIT = 100;
export const MAX_PAGES_PER_RUN = 50;

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

export type PosPullChanges = {
  orders: PosPullOrderSnapshot[];
  receipts: PosPullReceiptSnapshot[];
  payments: PosPullPaymentSnapshot[];
  receiptEvents: PosPullReceiptEventSnapshot[];
  shifts: PosPullShiftSnapshot[];
};

export type PosPullResponse = {
  ok: true;
  schemaVersion: 1;
  serverTime: string;
  scope: {
    orgId: string;
    deviceId: string;
  };
  changes: PosPullChanges;
  nextCursors: PullCursors;
  hasMore: Record<PullEntityType, boolean>;
};

export type PosPullRequest = {
  schemaVersion: 1;
  deviceId: string;
  licenseKey: string;
  cursors: PullCursors;
  limit: number;
};

export type OutboxEvent = {
  localId: string;
  type: string;
  status: "pending" | "syncing" | "done" | "failed";
  createdAt: number;
};

export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type PullCredentials = {
  deviceId: string;
  licenseKey: string;
  orgId?: string | null;
};

export type PullApiClient = {
  postPull(request: PosPullRequest): Promise<unknown>;
};

export type SyncChangeEmitter = {
  emitOrdersChanged(detail?: unknown): void;
  emitSalesChanged(detail?: unknown): void;
  emitReceiptEventsChanged(detail?: unknown): void;
  emitShiftsChanged(detail?: unknown): void;
};
