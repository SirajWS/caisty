// apps/caisty-site/src/lib/portalApi.ts

import { mapPortalApiError } from "./caistyTerminology";

// Basis-URL für das Portal-Backend
// Development: http://localhost:3333
// Production: https://api.caisty.com
const RAW_API_BASE = import.meta.env.VITE_CLOUD_API_URL || 
  (import.meta.env.DEV ? "http://localhost:3333" : "https://api.caisty.com");

// alle Trailing-Slashes entfernen
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

// Debug-Log, damit wir in Browser-Konsole sehen, was wirklich benutzt wird
// (kannst du später wieder entfernen, wenn alles läuft)
// console.log("Caisty Portal API_BASE =", API_BASE);

const PORTAL_TOKEN_KEY = "caisty.portal.token";

export class PortalAuthError extends Error {
  readonly reason?: string;
  readonly code?: string;

  constructor(message: string, reason?: string, code?: string) {
    super(message);
    this.name = "PortalAuthError";
    this.reason = reason;
    this.code = code;
  }
}

export type PortalStatus = "active" | "pending" | "blocked";
export type LicenseStatus = "active" | "revoked" | "expired";

// kleine Zusammenfassung für Konto-Seite
export interface PortalPrimaryLicenseSummary {
  id: string;
  key: string;
  plan: string;
  status: LicenseStatus | string;
  validUntil: string | null;
}

export interface PortalCustomer {
  id: string;
  orgId: string;
  name: string;
  email: string;
  portalStatus: PortalStatus;
  /** From GET /portal/me: Stripe Billing Portal available (active Stripe subscription + cus_ id). */
  stripeBillingPortalEligible?: boolean;
  /**
   * From GET /portal/me: inferred from active Starter/Pro subscription.priceCents
   * vs checkout gross amounts; null if no row or no match (e.g. legacy pricing).
   */
  paidBillingPeriod?: "monthly" | "yearly" | null;
  // nur bei /portal/me befüllt
  primaryLicense?: PortalPrimaryLicenseSummary | null;
}

interface AuthResponse {
  ok: boolean;
  token?: string;
  customer?: PortalCustomer;
  message?: string;
  reason?: string;
  code?: string;
  requiresVerification?: boolean;
  verifyLink?: string;
}

export interface PortalRegisterResult {
  ok: true;
  requiresVerification: true;
  message: string;
  customer: { id: string; email: string; name: string };
  verifyLink?: string;
}

// ---------- Token-Storage ----------

export function getStoredPortalToken(): string | null {
  try {
    return localStorage.getItem(PORTAL_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredPortalToken(token: string | null) {
  try {
    if (!token) {
      localStorage.removeItem(PORTAL_TOKEN_KEY);
    } else {
      localStorage.setItem(PORTAL_TOKEN_KEY, token);
    }
  } catch {
    // ignore
  }
}

// kompatibel zu altem Code
export function storePortalToken(token: string) {
  setStoredPortalToken(token);
}

export function clearPortalToken() {
  setStoredPortalToken(null);
}

// ---------- Auth ----------

export async function portalRegister(input: {
  name: string;
  email: string;
  password: string;
}): Promise<PortalRegisterResult> {
  const res = await fetch(`${API_BASE}/portal/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as AuthResponse;

  if (!res.ok || !data.ok) {
    if (data.reason === "email_taken") {
      throw new PortalAuthError(
        "An account with this email already exists.",
        "email_taken",
      );
    }
    throw new PortalAuthError(
      data.message ?? "Registrierung fehlgeschlagen.",
      data.reason,
    );
  }

  if (!data.requiresVerification || !data.customer) {
    throw new PortalAuthError("Unexpected registration response.");
  }

  return {
    ok: true,
    requiresVerification: true,
    message:
      data.message ??
      "Account created. Please check your inbox and verify your email address.",
    customer: {
      id: data.customer.id,
      email: data.customer.email,
      name: data.customer.name,
    },
    verifyLink: data.verifyLink,
  };
}

export async function portalLogin(input: {
  email: string;
  password: string;
}): Promise<PortalCustomer> {
  const res = await fetch(`${API_BASE}/portal/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as AuthResponse;

  if (!res.ok || !data.ok) {
    const errorMessage =
      data.message ||
      (data.reason === "google_auth_required"
        ? "Dieses Konto wurde mit Google erstellt. Bitte melde dich mit Google an."
        : data.reason === "email_not_verified"
          ? "Please verify your email address before logging in."
          : "Login fehlgeschlagen.");
    throw new PortalAuthError(errorMessage, data.reason, data.code);
  }

  if (!data.token || !data.customer) {
    throw new PortalAuthError("Login fehlgeschlagen.");
  }

  storePortalToken(data.token);
  return data.customer;
}

interface VerifyEmailResponse {
  ok: boolean;
  message?: string;
  email?: string;
  error?: string;
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = (await res.json()) as VerifyEmailResponse;

  if (!res.ok || !data.ok) {
    throw new Error(
      data.error === "INVALID_OR_EXPIRED_TOKEN" ||
        data.error === "TOKEN_ALREADY_USED"
        ? "INVALID_OR_EXPIRED_TOKEN"
        : data.error || "Verification failed.",
    );
  }

  return data;
}

interface ResendVerificationResponse {
  ok: boolean;
  message?: string;
  error?: string;
  verifyLink?: string;
}

export async function resendVerificationEmail(
  email: string,
): Promise<ResendVerificationResponse> {
  const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = (await res.json()) as ResendVerificationResponse;

  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Could not resend verification email.");
  }

  return data;
}

// Google OAuth Login
export function getGoogleAuthUrl(): string {
  return `${API_BASE}/portal/auth/google`;
}

// ---------- Password Reset ----------

interface ForgotPasswordResponse {
  ok: boolean;
  message?: string;
  error?: string;
  resetLink?: string; // Nur in Development
}

export async function requestPasswordReset(
  email: string,
): Promise<ForgotPasswordResponse> {
  const res = await fetch(`${API_BASE}/portal/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = (await res.json()) as ForgotPasswordResponse;

  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Fehler beim Anfordern des Reset-Links");
  }

  // Debug: Log die Response (nur in Development)
  if (import.meta.env.DEV) {
    console.log("Password reset response:", data);
  }

  return data;
}

interface ResetPasswordResponse {
  ok: boolean;
  token?: string;
  message?: string;
  error?: string;
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ResetPasswordResponse> {
  const res = await fetch(`${API_BASE}/portal/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = (await res.json()) as ResetPasswordResponse;

  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Fehler beim Zurücksetzen des Passworts");
  }

  return data;
}

export async function fetchPortalMe(): Promise<PortalCustomer | null> {
  const token = getStoredPortalToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/portal/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearPortalToken();
    return null;
  }

  if (!res.ok) {
    throw new Error("Konnte Kundendaten nicht laden.");
  }

  const data = (await res.json()) as {
    ok: boolean;
    customer?: PortalCustomer;
  };

  if (!data.ok || !data.customer) return null;
  return data.customer;
}

export type StripeBillingPortalResponse = {
  ok: boolean;
  url?: string;
  error?: string;
  message?: string;
};

/**
 * Opens Stripe Customer Billing Portal for the logged-in portal customer.
 * Caller should assign `window.location.href` to the returned URL.
 */
export async function createStripeBillingPortalSession(
  returnUrl?: string,
): Promise<string> {
  const token = getStoredPortalToken();
  if (!token) {
    throw new Error("Nicht angemeldet.");
  }

  const res = await fetch(`${API_BASE}/api/billing/portal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(returnUrl ? { returnUrl } : {}),
  });

  const data = (await res.json()) as StripeBillingPortalResponse;

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  if (!res.ok || !data.ok || !data.url) {
    throw new Error(
      data.message ??
        (data.error === "no_stripe_customer"
          ? "No Stripe customer found for this account."
          : "Billing portal could not be opened."),
    );
  }

  return data.url;
}

// Konto-Update
export async function updatePortalAccount(input: {
  name?: string;
  email?: string;
}): Promise<PortalCustomer> {
  const token = getStoredPortalToken();
  if (!token) throw new Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/account`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as {
    ok: boolean;
    customer?: PortalCustomer;
    message?: string;
  };

  if (!res.ok || !data.ok || !data.customer) {
    throw new Error(
      data.message ?? "Konto konnte nicht aktualisiert werden.",
    );
  }

  return data.customer;
}

// Passwort ändern
export async function changePortalPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const token = getStoredPortalToken();
  if (!token) throw new Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as { ok: boolean; message?: string };

  if (!res.ok || !data.ok) {
    throw new Error(
      data.message ?? "Passwort konnte nicht geändert werden.",
    );
  }
}

// ---------- Datentypen für Portal-Listen ----------

export interface PortalLicense {
  id: string;
  key: string;
  plan: string; // "trial" | "starter" | "pro" | "business"
  status: LicenseStatus | string;
  /** Positive integer = hard cap. null = unlimited (Business). */
  maxDevices: number | null;
  /** Present when API marks unlimited seats explicitly. */
  unlimitedDevices?: boolean;
  validUntil: string | null; // ISO
  createdAt: string; // ISO
}

export interface PortalDevice {
  id: string;
  name: string;
  deviceId: string;
  lastSeenAt: string | null; // ISO oder null
  status: "online" | "offline" | "never_seen" | string;
  /** License seat binding — separate from connection status. */
  bindingStatus?: "bound" | "released";
  releasedAt?: string | null;
  licenseKey: string | null;
  licensePlan?: string | null;
  /**
   * Legacy/grouped shape from /portal/devices. Kept optional for backward
   * compatibility; `licenseKey` is derived from this when absent.
   */
  licenseKeys?: Array<{ key: string; plan?: string | null }> | null;
  /** Reported by POS heartbeat when available. */
  appVersion?: string | null;
  platform?: string | null;
  storeName?: string | null;
  location?: string | null;
}

/** Normalize the /portal/devices response into a stable PortalDevice shape. */
export function normalizePortalDevice(raw: PortalDevice): PortalDevice {
  const licenseKey =
    raw.licenseKey ?? raw.licenseKeys?.[0]?.key ?? null;
  const licensePlan =
    raw.licensePlan ?? raw.licenseKeys?.[0]?.plan ?? null;

  return {
    ...raw,
    id: raw.id ?? raw.deviceId,
    deviceId: raw.deviceId ?? raw.id,
    bindingStatus: raw.bindingStatus ?? "bound",
    releasedAt: raw.releasedAt ?? null,
    licenseKey,
    licensePlan,
  };
}

export type PortalOrdersPaymentSummary = {
  cashCents: number;
  cardCents: number;
  voucherCents: number;
  otherCents: number;
  currency: string;
};

export type PortalOnlinePaymentSummary = {
  cashPaidCents: number;
  cardPaidCents: number;
  onlinePaidCents: number;
  pendingCents: number;
  currency: string;
};

export type PortalOpenShiftRecord = {
  shiftId: string;
  status: "open" | "closed";
  cashier: string | null;
  deviceName: string | null;
  businessDate: string;
  startedAt: string;
  durationMinutes: number;
  openingFloatMinor: number;
  currency: string;
};

export type PortalOrdersSummary = {
  allOrdersCount: number;
  liveOrdersCount: number;
  onlineOrdersCount: number;
  receiptsCount: number;
  refundsCount: number;
  hasOpenShift: boolean;
  /** @deprecated Use allOrdersCount */
  ordersCount: number;
  revenueCents: number;
  posRevenueCents: number;
  onlineRevenueCents: number;
  averageOrderMinor: number;
  openShift: PortalOpenShiftRecord | null;
  paymentSummary: PortalOrdersPaymentSummary;
  onlinePaymentSummary: PortalOnlinePaymentSummary;
};

export type PortalOrderStatus =
  | "new"
  | "accepted"
  | "open"
  | "in_progress"
  | "ready"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export type PortalOrderSource =
  | "pos"
  | "provider"
  | "online"
  | "delivery"
  | "unknown";

export type PortalOrderPaymentStatus = "pending" | "paid" | "cancelled" | "unknown";

export type PortalOrderTimelineEntry = {
  id: string;
  kind:
    | "created"
    | "preparing"
    | "ready"
    | "paid"
    | "completed"
    | "cancelled"
    | "refunded";
  label: string;
  occurredAt: string;
  actor: string | null;
  summary: string | null;
};

export type PortalOrderRecord = {
  id: string;
  localOrderId: string;
  deviceId: string;
  soldAt: string | null;
  businessDate: string | null;
  rawStatus: string;
  normalizedStatus: PortalOrderStatus;
  statusLabel: string;
  /** @deprecated Use normalizedStatus */
  status: string;
  paymentMethod: string | null;
  paymentStatus: PortalOrderPaymentStatus;
  paymentDisplay: string;
  amountCents: number;
  currency: string;
  cashier: string | null;
  deviceName: string;
  receiptId: string | null;
  receiptNumber: string | null;
  receiptStatus: PortalReceiptStatus | null;
  refundedAmountCents: number;
  hasPaymentChange: boolean;
  lines: PortalReceiptLineItem[];
  timeline: PortalOrderTimelineEntry[];
  orderSource: PortalOrderSource;
  isProviderOrder: boolean;
  platform: string | null;
  providerName: string | null;
  providerOrderId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  deliveryAddress: string | null;
  customerNote: string | null;
  detailsSummary: string | null;
};

export type PortalReceiptLineItem = {
  productName: string | null;
  sku: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

/** POS receipt business lifecycle status (Sprint 5.1+). */
export type PortalReceiptStatus =
  | "active"
  | "refunded"
  | "partial_refund"
  | "voided";

export type PortalReceiptRecord = {
  id: string;
  localReceiptId: string;
  receiptNumber: string | null;
  issuedAt: string | null;
  customer: string | null;
  paymentMethod: string | null;
  /** Business lifecycle status; all synced receipts are `active` until refund/void sprints. */
  status: PortalReceiptStatus;
  fiscalStatus: string;
  amountCents: number;
  currency: string;
  items: PortalReceiptLineItem[];
};

export interface PortalOrdersResponse {
  timezone: string;
  period: "today";
  summary: PortalOrdersSummary;
  orders: PortalOrderRecord[];
  providerOrders: PortalOrderRecord[];
  receipts: PortalReceiptRecord[];
  recentOrders: PortalOrderRecord[];
}

export type PortalOrderPaymentRecord = {
  method: string;
  amountCents: number;
  currency: string;
  paidAt: string | null;
};

export type PortalReceiptTimelineEntry = {
  id: string;
  kind: string;
  label: string;
  occurredAt: string;
  actor: string | null;
  summary: string | null;
};

export type PortalOrderDetailResponse = PortalOrderRecord & {
  payments: PortalOrderPaymentRecord[];
  receipt: PortalReceiptRecord | null;
  receiptTimeline: PortalReceiptTimelineEntry[];
  discountCents: number;
  taxCents: number;
  netCents: number;
  queueNumber: string | null;
  tableName: string | null;
  customerName: string | null;
  notes: string | null;
  platform: string | null;
  providerOrderId: string | null;
  providerName: string | null;
  orderSource: PortalOrderSource;
  isProviderOrder: boolean;
  customerPhone: string | null;
  customerEmail: string | null;
  deliveryAddress: string | null;
  customerNote: string | null;
  paymentStatus: PortalOrderPaymentStatus;
  paymentDisplay: string;
};

export type PortalReceiptEventRecord = {
  id: string;
  receiptId: string;
  eventType: "created" | "printed" | "reprinted" | string;
  occurredAt: string;
  actor: string | null;
  payload: Record<string, unknown>;
  schemaVersion: number;
};

export type PortalReceiptListItem = PortalReceiptRecord & {
  deviceName: string | null;
  printCount: number;
  reprintCount: number;
  lastEventType: string | null;
  lastEventAt: string | null;
  cashier: string | null;
};

export type PortalReceiptsSummary = {
  receiptsCount: number;
  activeCount: number;
  printedCount: number;
  reprintedCount: number;
  refundsCount: number;
  posRevenueCents: number;
  paymentSummary: PortalOrdersPaymentSummary;
};

export type PortalReceiptsResponse = {
  timezone: string;
  period: string;
  summary: PortalReceiptsSummary;
  receipts: PortalReceiptListItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
};

export type PortalReceiptPrintStats = {
  hasOriginalPrint: boolean;
  reprintCount: number;
  lastPrintAt: string | null;
};

export type PortalReceiptRefundSummary = {
  originalAmountCents: number;
  refundedAmountCents: number;
  refundableAmountCents: number;
  currency: string;
};

export type PortalReceiptDetailResponse = {
  receipt: PortalReceiptRecord & {
    deviceName: string | null;
    localOrderId: string | null;
    netCents: number;
    taxCents: number;
    grossCents: number;
  };
  events: PortalReceiptEventRecord[];
  timeline: PortalReceiptTimelineEntry[];
  refundSummary: PortalReceiptRefundSummary;
  hasPaymentChange: boolean;
  printStats: PortalReceiptPrintStats;
};

export type PortalReceiptsQuery = {
  period?: string;
  paymentMethod?: string;
  status?: string;
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  page?: number;
};

export interface PortalDashboardSummary {
  timezone: string;
  period: "today";
  todayRevenueCents: number;
  posRevenueCents: number;
  onlineRevenueCents: number;
  ordersToday: number;
  liveOrdersCount: number;
  onlineOrdersCount: number;
  receiptsToday: number;
  refundsCount: number;
  averageOrderMinor: number;
  currency: string;
  lastSynchronizationAt: string | null;
  hasSalesData: boolean;
  paymentSummary: PortalOrdersPaymentSummary;
  onlinePaymentSummary: PortalOnlinePaymentSummary;
  recentOrders: Array<{
    id: string;
    localOrderId: string;
    soldAt: string | null;
    normalizedStatus: PortalOrderStatus;
    statusLabel: string;
    paymentMethod: string | null;
    paymentDisplay: string;
    amountCents: number;
    currency: string;
    receiptId: string | null;
    receiptNumber: string | null;
    receiptStatus: PortalReceiptStatus | null;
    isProviderOrder: boolean;
    providerName: string | null;
  }>;
}

/** POS sales analytics — monetary fields are ISO 4217 minor units. */
export type PortalReportsPeriod =
  | "today"
  | "yesterday"
  | "this_week"
  | "7_days"
  | "30_days"
  | "this_month"
  | "12_months"
  | "this_year"
  | "all_time";

export interface PortalReportsOverview {
  revenueMinor: number;
  ordersCount: number;
  receiptsCount: number;
  refundsCount: number;
  averageOrderMinor: number;
  vatMinor: number;
  currency: string;
}

export interface PortalReportsRevenuePoint {
  label: string;
  bucketStart: string;
  revenueMinor: number;
  ordersCount: number;
}

export interface PortalReportsHourlyPoint {
  hour: number;
  revenueMinor: number;
  ordersCount: number;
}

export interface PortalReportsPaymentMethods {
  cashMinor: number;
  cardMinor: number;
  voucherMinor: number;
  otherMinor: number;
  currency: string;
}

export interface PortalReportsTopProduct {
  productName: string;
  quantity: number;
  revenueMinor: number;
  category: string | null;
}

export interface PortalReportsTaxes {
  netRevenueMinor: number;
  vatMinor: number;
  grossRevenueMinor: number;
  fiscalReceiptsCount: number;
  currency: string;
}

export interface PortalReportsBusinessTrends {
  bestSalesDay: string | null;
  bestSalesHour: string | null;
  largestReceiptMinor: number;
  mostUsedPayment: string | null;
  mostSoldProduct: string | null;
  currency: string;
}

export interface PortalReportsSummary {
  timezone: string;
  period: PortalReportsPeriod;
  hasSalesData: boolean;
  overview: PortalReportsOverview;
  /** Same period splits as Dashboard/Orders (from portal sales period stats). */
  posRevenueCents: number;
  onlineRevenueCents: number;
  liveOrdersCount: number;
  onlineOrdersCount: number;
  revenueSeries: PortalReportsRevenuePoint[];
  salesByHour: PortalReportsHourlyPoint[];
  paymentMethods: PortalReportsPaymentMethods;
  onlinePaymentSummary: PortalOnlinePaymentSummary;
  topProducts: PortalReportsTopProduct[];
  topEmployees: [];
  taxes: PortalReportsTaxes;
  businessTrends: PortalReportsBusinessTrends;
}

export interface PortalInvoiceAmountBreakdown {
  netCents: number;
  taxCents: number;
  grossCents: number;
  vatRatePercent: number;
}

export interface PortalInvoice {
  id: string;
  number: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  dueAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  billingPeriod?: "monthly" | "yearly" | null;
  billingPeriodLabel?: string | null;
  plan?: string | null;
  /** Present from invoice detail API: matches checkout-style net / VAT / gross. */
  amountBreakdown?: PortalInvoiceAmountBreakdown | null;
}

// Detail-Typ für einzelne Rechnung
export interface PortalInvoiceDetail {
  invoice: PortalInvoice;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  org: {
    id: string;
    name: string;
    address?: string;
    vatId?: string;
  } | null;
}

// ---------- generischer GET-Helper ----------

async function authGet<T>(path: string): Promise<T> {
  const token = getStoredPortalToken();
  if (!token) {
    throw new Error("Kein Portal-Token vorhanden.");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  if (!res.ok) {
    throw new Error(`Fehler beim Laden von ${path}: ${res.status}`);
  }

  return (await res.json()) as T;
}

async function authPost<T>(path: string): Promise<T> {
  const token = getStoredPortalToken();
  if (!token) {
    throw new Error("Kein Portal-Token vorhanden.");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const data = (await res.json()) as T & { message?: string; code?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Fehler bei ${path}: ${res.status}`);
  }

  return data;
}

export type ReleasePortalDeviceResult = {
  ok: true;
  deviceId: string;
  releasedAt: string;
  licenseDevices: { used: number; limit: number } | null;
};

// ---------- Portal-Listen ----------

export async function fetchPortalLicenses(): Promise<PortalLicense[]> {
  return authGet<PortalLicense[]>("/portal/licenses");
}

export async function fetchPortalDevices(): Promise<PortalDevice[]> {
  const raw = await authGet<PortalDevice[]>("/portal/devices");
  return Array.isArray(raw) ? raw.map(normalizePortalDevice) : [];
}

export async function releasePortalDevice(
  deviceId: string,
): Promise<ReleasePortalDeviceResult> {
  return authPost<ReleasePortalDeviceResult>(
    `/portal/devices/${encodeURIComponent(deviceId)}/release`,
  );
}

export async function fetchPortalOrders(): Promise<PortalOrdersResponse> {
  return authGet<PortalOrdersResponse>("/portal/orders");
}

export async function fetchPortalOrderDetail(
  orderId: string,
): Promise<PortalOrderDetailResponse> {
  return authGet<PortalOrderDetailResponse>(
    `/portal/orders/${encodeURIComponent(orderId)}`,
  );
}

export async function fetchPortalReceipts(
  query: PortalReceiptsQuery = {},
): Promise<PortalReceiptsResponse> {
  const params = new URLSearchParams();
  if (query.period) params.set("period", query.period);
  if (query.paymentMethod) params.set("paymentMethod", query.paymentMethod);
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  if (query.sort) params.set("sort", query.sort);
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.offset != null) params.set("offset", String(query.offset));
  if (query.page != null) params.set("page", String(query.page));
  const qs = params.toString();
  return authGet<PortalReceiptsResponse>(
    qs ? `/portal/receipts?${qs}` : "/portal/receipts",
  );
}

export async function fetchPortalReceiptDetail(
  receiptId: string,
): Promise<PortalReceiptDetailResponse> {
  return authGet<PortalReceiptDetailResponse>(
    `/portal/receipts/${encodeURIComponent(receiptId)}`,
  );
}

export type PortalShiftRecord = {
  id: string;
  localShiftId: string;
  status: "open" | "closed";
  cashier: string | null;
  deviceId: string;
  deviceName: string | null;
  businessDate: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  openingFloatMinor: number;
  closingFloatMinor: number | null;
  previousClosingFloatMinor: number | null;
  currency: string;
};

export type PortalShiftsQuery = {
  status?: string;
  from?: string;
  to?: string;
  deviceId?: string;
  limit?: number;
};

export async function fetchPortalShifts(
  query: PortalShiftsQuery = {},
): Promise<{ shifts: PortalShiftRecord[] }> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.deviceId) params.set("deviceId", query.deviceId);
  if (query.limit != null) params.set("limit", String(query.limit));
  const qs = params.toString();
  return authGet<{ shifts: PortalShiftRecord[] }>(
    qs ? `/portal/shifts?${qs}` : "/portal/shifts",
  );
}

export async function fetchPortalDashboardSummary(): Promise<PortalDashboardSummary> {
  return authGet<PortalDashboardSummary>("/portal/dashboard/summary");
}

export async function fetchPortalReportsSummary(
  period: string,
): Promise<PortalReportsSummary> {
  const query = new URLSearchParams({ period });
  return authGet<PortalReportsSummary>(
    `/portal/reports/summary?${query.toString()}`,
  );
}

export async function fetchPortalInvoices(): Promise<PortalInvoice[]> {
  // Bestehender /portal/invoices-Endpunkt (Liste als Array)
  return authGet<PortalInvoice[]>("/portal/invoices");
}

// ---------- Invoice-Detail & HTML ----------

export async function fetchPortalInvoice(
  id: string,
): Promise<PortalInvoiceDetail> {
  // Erwartet Shape { ok, invoice, customer, org } aus der API
  const data = await authGet<any>(`/portal/invoices/${id}`);
  if (!data.ok) {
    throw new Error(data.message ?? "Rechnung konnte nicht geladen werden.");
  }
  return {
    invoice: data.invoice as PortalInvoice,
    customer: data.customer,
    org: data.org ?? null,
  };
}

export function getPortalInvoiceHtmlUrl(id: string): string {
  return `${API_BASE}/portal/invoices/${id}/html`;
}

export async function fetchPortalInvoiceHtml(id: string): Promise<string> {
  const token = getStoredPortalToken();
  if (!token) {
    throw new Error("Nicht angemeldet.");
  }

  const res = await fetch(getPortalInvoiceHtmlUrl(id), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  if (!res.ok) {
    throw new Error(`Rechnungs-HTML konnte nicht geladen werden (${res.status}).`);
  }

  return res.text();
}

// ---------- Trial-Lizenz einmalig anlegen ----------

export interface PortalLicenseCreateResponse {
  ok: boolean;
  license?: PortalLicense;
  message?: string;
  reason?: string;
}

export async function createTrialLicense(): Promise<PortalLicense> {
  const token = getStoredPortalToken();
  if (!token) {
    throw new Error("Nicht angemeldet.");
  }

  const res = await fetch(`${API_BASE}/portal/trial-license`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const data = (await res.json()) as PortalLicenseCreateResponse;

  if (!res.ok || !data.ok || !data.license) {
    if (
      data.reason === "already_had_trial" ||
      data.reason === "trial_already_used"
    ) {
      throw new Error(
        data.message ??
          "Für dieses Konto wurde bereits eine Testlizenz angelegt.",
      );
    }

    if (data.reason === "active_plan_exists") {
      throw new Error(
        data.message ??
          "Für dieses Konto existiert bereits ein aktiver, bezahlter Plan.",
      );
    }

    throw new Error(
      data.message ?? "Testlizenz konnte nicht erstellt werden.",
    );
  }

  return data.license;
}

// ---------- Upgrade (Starter/Pro) ----------

export type PortalUpgradeStartResponse = {
  ok: boolean;
  message?: string;
  reason?: string;
  subscription?: {
    id: string;
    plan: string;
    status: string;
  };
  invoice?: {
    id: string;
    number: string;
    amountCents: number;
    currency: string;
    status: string;
    issuedAt: string;
    dueAt: string;
  };
  redirectUrl?: string;
  paypalOrderId?: string;
};

export async function startPortalUpgrade(
  plan: "starter" | "pro",
): Promise<PortalUpgradeStartResponse> {
  const token = getStoredPortalToken();
  if (!token) throw Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/upgrade/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan }),
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const data = (await res.json()) as PortalUpgradeStartResponse;

  if (!res.ok || !data.ok) {
    throw new Error(
      data.message ?? "Upgrade konnte nicht gestartet werden.",
    );
  }

  return data;
}

// ---------- Support / Kontakt aus Portal ----------

function sanitizePortalClientError(message: string): string {
  const m = message.trim();
  if (
    /postgres|relation |violates|null value|constraint|sqlstate|internal server error/i.test(
      m,
    )
  ) {
    return "Die Anfrage konnte nicht verarbeitet werden. Bitte versuche es später erneut.";
  }
  return m;
}

export interface PortalSupportMessage {
  id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed" | string;
  createdAt: string; // ISO
  replyText?: string | null;
  repliedAt?: string | null;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
}

export async function createPortalSupportMessage(input: {
  subject: string;
  message: string;
}): Promise<PortalSupportMessage> {
  const token = getStoredPortalToken();
  if (!token) throw new Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/support-messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const ct = res.headers.get("content-type") ?? "";
  let data: any = {};
  if (ct.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok || data.ok === false) {
    const raw =
      data.error ||
      data.message ||
      "Nachricht konnte nicht gesendet werden.";
    throw new Error(sanitizePortalClientError(String(raw)));
  }

  const msg = (data.item ?? (data.id ? data : null)) as PortalSupportMessage | null;
  if (!msg?.id) {
    throw new Error(
      sanitizePortalClientError(
        "Unerwartete Antwort vom Server. Bitte versuche es erneut.",
      ),
    );
  }
  return msg;
}

export async function fetchPortalSupportMessages(): Promise<
  PortalSupportMessage[]
> {
  const token = getStoredPortalToken();
  if (!token) throw new Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/support-messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const ct = res.headers.get("content-type") ?? "";
  let data: any = {};
  if (ct.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) {
    throw new Error(
      sanitizePortalClientError(
        String(
          data.message ||
            data.error ||
            "Support-Anfragen konnten nicht geladen werden.",
        ),
      ),
    );
  }

  if (Array.isArray(data)) {
    return data as PortalSupportMessage[];
  }

  return (data.items || data.messages || []) as PortalSupportMessage[];
}

// ---------- Business profile ----------

export type PortalBusinessAddress = {
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
};

export type PortalFiscalStatus =
  | "not_required"
  | "required"
  | "required_coming_soon"
  | "pending_setup"
  | "active"
  | "error";

export type PortalComplianceStatus =
  | "incomplete"
  | "ready"
  | "action_required";

export type PortalPosConfigurationStatus = "not_ready" | "ready";

export interface PortalBusinessProfile {
  companyName: string;
  legalName: string;
  country: string | null;
  currency: string;
  defaultLanguage: string;
  businessAddress: PortalBusinessAddress;
  vatId: string;
  taxId: string;
  fiscalStatus: PortalFiscalStatus;
  fiscalProvider: string;
  fiscalProviderDisplayKey: string;
  providerType?: string;
  providerLabel?: string;
  fiscalRequired?: boolean;
  fiscalEnvironment: string;
  complianceStatus: PortalComplianceStatus;
  posConfigurationStatus: PortalPosConfigurationStatus;
  fiscalProfileKey?: string;
  fiscalConfigurationLabel?: string;
  /** @deprecated use fiscalConfigurationLabel */
  fiscalPackage: string;
  receiptMode: "standard" | "certified" | "standard_until_certified" | "certified_germany";
  supportedExports?: string[];
  posDownloadAllowed?: boolean;
  fiscalNotice?: string | null;
  mode?: "api_service" | "standard" | "coming_soon";
  posReadiness: PortalPosConfigurationStatus;
}

export type PortalPosFiscalConfig = {
  country: string | null;
  currency: string;
  fiscalRequired: boolean;
  providerKey: string;
  providerLabel: string;
  providerType: string;
  fiscalStatus: string;
  receiptMode: string;
  fiscalConfigurationLabel: string;
  posDownloadAllowed: boolean;
  fiscalNotice: string | null;
  supportedExports: string[];
  mode: string;
};

export type PortalBusinessPatch = {
  companyName?: string;
  legalName?: string;
  country?: string | null;
  currency?: string;
  defaultLanguage?: string;
  businessAddress?: PortalBusinessAddress;
  vatId?: string;
  taxId?: string;
};

type PortalBusinessResponse = {
  ok: boolean;
  business?: PortalBusinessProfile;
  error?: string;
  message?: string;
};

export async function fetchPortalBusiness(): Promise<PortalBusinessProfile> {
  const token = getStoredPortalToken();
  if (!token) throw new Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/business`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const data = (await res.json()) as PortalBusinessResponse;

  if (!res.ok || !data.ok || !data.business) {
    throw new Error(
      mapPortalApiError(
        new Error(data.message ?? data.error ?? "business_profile_missing"),
        {
          businessMissing:
            "Complete your Business profile.",
          default:
            data.message ??
            (data.error === "migration_required"
              ? "Business profile storage is not ready. Please contact support or apply the latest database migration."
              : "Business profile could not be loaded."),
        },
      ),
    );
  }

  return data.business;
}

export async function updatePortalBusiness(
  patch: PortalBusinessPatch,
): Promise<PortalBusinessProfile> {
  const token = getStoredPortalToken();
  if (!token) throw new Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/business`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const data = (await res.json()) as PortalBusinessResponse;

  if (!res.ok || !data.ok || !data.business) {
    throw new Error(
      data.message ??
        (data.error === "migration_required"
          ? "Business profile storage is not ready. Please contact support or apply the latest database migration."
          : data.error ?? "Business profile could not be saved."),
    );
  }

  return data.business;
}

export async function fetchPortalBusinessPosConfig(): Promise<PortalPosFiscalConfig> {
  const token = getStoredPortalToken();
  if (!token) throw new Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/business/pos-config`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const data = (await res.json()) as {
    ok: boolean;
    config?: PortalPosFiscalConfig;
    error?: string;
  };

  if (!res.ok || !data.ok || !data.config) {
    throw new Error(data.error ?? "POS configuration could not be loaded.");
  }

  return data.config;
}
