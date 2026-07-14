/**
 * Portal-facing receipt DTOs and mappers.
 * Central place for receipt API shape — extend here in future receipt lifecycle sprints.
 */

import type { PortalReceiptLineItem } from "./portalOrders.js";
import {
  normalizeReceiptStatus,
  type ReceiptStatus,
} from "./receiptStatus.js";

export type PortalReceiptRecord = {
  id: string;
  localReceiptId: string;
  receiptNumber: string | null;
  issuedAt: string | null;
  customer: string | null;
  paymentMethod: string | null;
  /** Business lifecycle status (Sprint 5.1+). */
  status: ReceiptStatus;
  fiscalStatus: string;
  amountCents: number;
  currency: string;
  items: PortalReceiptLineItem[];
};

export type PortalReceiptDbRow = {
  id: string;
  deviceId: string;
  localReceiptId: string;
  receiptNumber: string | null;
  soldAt: Date;
  grossCents: number;
  currency: string;
  fiscalStatus: string;
  status: string | null;
  localOrderId: string | null;
};

export function toPortalReceiptIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

export function mapPortalReceiptRecord(input: {
  row: PortalReceiptDbRow;
  paymentMethod: string | null;
  items: PortalReceiptLineItem[];
}): PortalReceiptRecord {
  const { row } = input;
  return {
    id: row.id,
    localReceiptId: row.localReceiptId,
    receiptNumber: row.receiptNumber,
    issuedAt: toPortalReceiptIso(row.soldAt),
    customer: null,
    paymentMethod: input.paymentMethod,
    status: normalizeReceiptStatus(row.status),
    fiscalStatus: row.fiscalStatus,
    amountCents: row.grossCents,
    currency: row.currency,
    items: input.items,
  };
}
