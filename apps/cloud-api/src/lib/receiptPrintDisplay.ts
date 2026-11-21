import { RECEIPT_EVENT_TYPES } from "./receiptEventTypes.js";

export const PORTAL_PRINT_STATUS = {
  UNKNOWN: "unknown",
  CREATED: "created",
  PRINT_REQUESTED: "print_requested",
  REPRINT_REQUESTED: "reprint_requested",
} as const;

export type PortalPrintStatus =
  (typeof PORTAL_PRINT_STATUS)[keyof typeof PORTAL_PRINT_STATUS];

export type ReceiptLifecycleEvent = {
  eventType: string;
  occurredAt: Date | string;
  actor?: string | null;
  eventId?: string | null;
};

export type ReceiptLifecycleDisplay = {
  originalCashier: string | null;
  reprintActor: string | null;
  printStatus: PortalPrintStatus;
  printRequestCount: number;
  reprintRequestCount: number;
  printCount: number;
  reprintCount: number;
  lastPrintAt: string | null;
  lastEventType: string | null;
  lastEventAt: string | null;
  hasEvents: boolean;
  /** True when at least one `printed` event exists. Not physical printer confirmation. */
  hasOriginalPrint: boolean;
};

function eventTime(value: Date | string): number {
  const time = value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isFinite(time) ? time : 0;
}

function toIso(value: Date | string): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function actorSnapshot(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Derives portal print/cashier display from append-only receipt events.
 * Duplicate eventIds are ignored so retries cannot inflate counts.
 */
export function aggregateReceiptLifecycle(
  events: ReceiptLifecycleEvent[],
): ReceiptLifecycleDisplay {
  const seenIds = new Set<string>();
  const ordered = [...events]
    .filter((event) => {
      const id = event.eventId?.trim();
      if (!id) return true;
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    })
    .sort((a, b) => eventTime(a.occurredAt) - eventTime(b.occurredAt));

  let originalCashier: string | null = null;
  let reprintActor: string | null = null;
  let printRequestCount = 0;
  let reprintRequestCount = 0;
  let lastPrintAt: string | null = null;
  let lastEventType: string | null = null;
  let lastEventAt: string | null = null;
  let hasCreated = false;

  for (const event of ordered) {
    const actor = actorSnapshot(event.actor);
    const occurredIso = toIso(event.occurredAt);
    lastEventType = event.eventType;
    lastEventAt = occurredIso;

    if (event.eventType === RECEIPT_EVENT_TYPES.CREATED) {
      hasCreated = true;
      if (!originalCashier && actor) {
        originalCashier = actor;
      }
    }

    if (event.eventType === RECEIPT_EVENT_TYPES.PRINTED) {
      printRequestCount += 1;
      lastPrintAt = occurredIso;
      if (actor) reprintActor = actor;
    }

    if (event.eventType === RECEIPT_EVENT_TYPES.REPRINTED) {
      reprintRequestCount += 1;
      lastPrintAt = occurredIso;
      if (actor) reprintActor = actor;
    }
  }

  let printStatus: PortalPrintStatus = PORTAL_PRINT_STATUS.UNKNOWN;
  if (reprintRequestCount > 0) {
    printStatus = PORTAL_PRINT_STATUS.REPRINT_REQUESTED;
  } else if (printRequestCount > 0) {
    printStatus = PORTAL_PRINT_STATUS.PRINT_REQUESTED;
  } else if (hasCreated) {
    printStatus = PORTAL_PRINT_STATUS.CREATED;
  }

  return {
    originalCashier,
    reprintActor,
    printStatus,
    printRequestCount,
    reprintRequestCount,
    printCount: printRequestCount,
    reprintCount: reprintRequestCount,
    lastPrintAt,
    lastEventType,
    lastEventAt,
    hasEvents: ordered.length > 0,
    hasOriginalPrint: printRequestCount > 0,
  };
}

export function emptyReceiptLifecycle(): ReceiptLifecycleDisplay {
  return aggregateReceiptLifecycle([]);
}
