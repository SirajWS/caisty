export const EVT_ORDERS_CHANGED = "caisty:orders-changed";
export const EVT_SALES_CHANGED = "caisty:sales-changed";
export const EVT_RECEIPT_EVENTS_CHANGED = "caisty:receipt-events-changed";
export const EVT_SHIFTS_CHANGED = "caisty:shifts-changed";
export const EVT_SYNC_OUTBOX_CHANGED = "caisty:sync_outbox_changed";

export function createBrowserSyncEmitter(): {
  emitOrdersChanged(detail?: unknown): void;
  emitSalesChanged(detail?: unknown): void;
  emitReceiptEventsChanged(detail?: unknown): void;
  emitShiftsChanged(detail?: unknown): void;
  emitOutboxChanged(detail?: unknown): void;
} {
  const emit = (name: string, detail?: unknown) => {
    if (typeof window === "undefined") return;
    try {
      if (detail != null) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
      } else {
        window.dispatchEvent(new Event(name));
      }
    } catch {
      /* ignore */
    }
  };

  return {
    emitOrdersChanged: (detail) => emit(EVT_ORDERS_CHANGED, detail),
    emitSalesChanged: (detail) => emit(EVT_SALES_CHANGED, detail),
    emitReceiptEventsChanged: (detail) =>
      emit(EVT_RECEIPT_EVENTS_CHANGED, detail),
    emitShiftsChanged: (detail) => emit(EVT_SHIFTS_CHANGED, detail),
    emitOutboxChanged: (detail) => emit(EVT_SYNC_OUTBOX_CHANGED, detail),
  };
}

export function onPullOrdersChanged(handler: (detail?: unknown) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) =>
    handler((event as CustomEvent).detail);
  window.addEventListener(EVT_ORDERS_CHANGED, listener);
  return () => window.removeEventListener(EVT_ORDERS_CHANGED, listener);
}
