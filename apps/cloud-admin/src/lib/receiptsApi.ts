import { apiGet, apiPost } from "./api";

export type AdminReceiptDisplayStatus =
  | "completed"
  | "refunded"
  | "partial_refund"
  | "payment_changed"
  | "voided";

export type RefundReasonCode =
  | "customer_request"
  | "wrong_item"
  | "duplicate_payment"
  | "product_issue"
  | "order_cancelled"
  | "other";

export type PaymentMethodBucket = "cash" | "card" | "voucher" | "other";

export type AdminReceiptListItem = {
  id: string;
  receiptNumber: string | null;
  issuedAt: string | null;
  storeName: string | null;
  cashier: string | null;
  customerId: string | null;
  customerName: string | null;
  retailCustomer: string | null;
  paymentMethod: string | null;
  displayStatus: AdminReceiptDisplayStatus;
  statusLabel: string;
  amountCents: number;
  currency: string;
};

export type AdminReceiptsResponse = {
  ok: boolean;
  timezone: string;
  period: string;
  summary: {
    receiptsCount: number;
    paymentSummary: {
      cashCents: number;
      cardCents: number;
      voucherCents: number;
      otherCents: number;
      currency: string;
    };
  };
  receipts: AdminReceiptListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type AdminReceiptLineItem = {
  productName: string | null;
  sku: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  discountCents: number | null;
  taxRateBps: number | null;
};

export type AdminReceiptTimelineEntry = {
  id: string;
  kind: string;
  label: string;
  occurredAt: string;
  actor: string | null;
  details: string | null;
  amountCents: number | null;
  previousValue: string | null;
  newValue: string | null;
  reason: string | null;
};

export type AdminReceiptRefundSummary = {
  originalAmountCents: number;
  refundedAmountCents: number;
  refundableAmountCents: number;
  currency: string;
};

export type AdminReceiptActionAvailability = {
  available: boolean;
  reason: string | null;
};

export type AdminReceiptDetailResponse = {
  ok: boolean;
  receipt: {
    id: string;
    receiptNumber: string | null;
    issuedAt: string | null;
    businessName: string | null;
    customerId: string | null;
    customerName: string | null;
    customerEmail: string | null;
    storeName: string | null;
    deviceId: string;
    cashier: string | null;
    retailCustomer: string | null;
    localReceiptId: string;
    localOrderId: string | null;
    displayStatus: AdminReceiptDisplayStatus;
    statusLabel: string;
    paymentMethod: string | null;
    netCents: number;
    taxCents: number;
    grossCents: number;
    currency: string;
    items: AdminReceiptLineItem[];
  };
  payments: Array<{
    method: string;
    amountCents: number;
    currency: string;
    paidAt: string | null;
  }>;
  timeline: AdminReceiptTimelineEntry[];
  refundSummary: AdminReceiptRefundSummary;
  hasPaymentChange: boolean;
  printPayloads: {
    latestRefund: Record<string, unknown> | null;
    latestPaymentChange: Record<string, unknown> | null;
  };
  actions: {
    reprint: AdminReceiptActionAvailability;
    refund: AdminReceiptActionAvailability;
    changePayment: AdminReceiptActionAvailability;
  };
};

export type FetchAdminReceiptsParams = {
  period?: string;
  from?: string;
  to?: string;
  customerSearch?: string;
  paymentMethod?: string;
  status?: string;
  search?: string;
  cashier?: string;
  amountMin?: number;
  amountMax?: number;
  sort?: string;
  limit?: number;
  offset?: number;
};

export type RefundReceiptRequest = {
  amountCents: number;
  reasonCode: RefundReasonCode;
  reasonText?: string | null;
  refundPaymentMethod: PaymentMethodBucket;
  internalNote?: string | null;
  idempotencyKey: string;
};

export type ChangePaymentRequest = {
  newPaymentMethod: PaymentMethodBucket;
  reason: string;
  internalNote?: string | null;
  idempotencyKey: string;
};

export type ReceiptMutationResponse = {
  ok: boolean;
  receiptId?: string;
  eventId?: string;
  detail?: AdminReceiptDetailResponse;
  code?: string;
  message?: string;
};

function buildQuery(params: FetchAdminReceiptsParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

export async function fetchAdminReceipts(
  params: FetchAdminReceiptsParams = {},
): Promise<AdminReceiptsResponse> {
  return apiGet<AdminReceiptsResponse>(`/admin/receipts${buildQuery(params)}`);
}

export async function fetchAdminReceiptDetail(
  receiptId: string,
): Promise<AdminReceiptDetailResponse> {
  return apiGet<AdminReceiptDetailResponse>(
    `/admin/receipts/${encodeURIComponent(receiptId)}`,
  );
}

export async function refundAdminReceipt(
  receiptId: string,
  body: RefundReceiptRequest,
): Promise<ReceiptMutationResponse> {
  return apiPost<RefundReceiptRequest, ReceiptMutationResponse>(
    `/admin/receipts/${encodeURIComponent(receiptId)}/refund`,
    body,
  );
}

export async function changeAdminReceiptPayment(
  receiptId: string,
  body: ChangePaymentRequest,
): Promise<ReceiptMutationResponse> {
  return apiPost<ChangePaymentRequest, ReceiptMutationResponse>(
    `/admin/receipts/${encodeURIComponent(receiptId)}/payment-change`,
    body,
  );
}
