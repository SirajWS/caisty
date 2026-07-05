import type {
  BusinessEvent,
  DeriveOrdersInput,
  OrdersDerivedState,
  OrdersKpi,
  PaymentMethodCard,
} from "./types";

function waitingKpi(id: string, label: string, hint: string, dash: string): OrdersKpi {
  return { id, label, value: dash, hint };
}

function deriveSummary(input: DeriveOrdersInput): OrdersKpi[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const hint = o.waitingPosSync;

  return [
    waitingKpi("revenue", o.kpiRevenue, hint, dash),
    waitingKpi("orders", o.kpiOrders, hint, dash),
    waitingKpi("receipts", o.kpiReceipts, hint, dash),
    waitingKpi("refunds", o.kpiRefunds, hint, dash),
    waitingKpi("avg_order", o.kpiAvgOrder, hint, dash),
    waitingKpi("open_shift", o.kpiOpenShift, hint, dash),
  ];
}

function derivePayments(input: DeriveOrdersInput): PaymentMethodCard[] {
  const o = input.t.orders;
  const waiting = o.waitingPosSync;

  return [
    { id: "cash", label: o.paymentCash, value: waiting, tone: "unknown" },
    { id: "card", label: o.paymentCard, value: waiting, tone: "unknown" },
    { id: "voucher", label: o.paymentVoucher, value: waiting, tone: "unknown" },
    { id: "other", label: o.paymentOther, value: waiting, tone: "unknown" },
  ];
}

function deriveEvents(input: DeriveOrdersInput): BusinessEvent[] {
  const o = input.t.orders;
  const { data } = input;
  const items: BusinessEvent[] = [];

  for (const dev of data.devices) {
    if (!dev.lastSeenAt) continue;
    const isOnline = (dev.status ?? "").toLowerCase() === "online";
    items.push({
      id: `dev-${dev.id}`,
      kind: isOnline ? "pos_connected" : "device_connected",
      label: isOnline
        ? `${o.eventPosConnected} · ${dev.name || dev.deviceId}`
        : `${o.eventDeviceSeen} · ${dev.name || dev.deviceId}`,
      at: dev.lastSeenAt,
    });
  }

  if (data.lastSyncedAt) {
    items.push({
      id: "cloud-sync",
      kind: "cloud_synced",
      label: o.eventCloudSynced,
      at: data.lastSyncedAt.toISOString(),
    });
  }

  return items
    .filter((e) => Number.isFinite(new Date(e.at).getTime()))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 12);
}

function deriveQuickActions(input: DeriveOrdersInput): OrdersDerivedState["quickActions"] {
  const o = input.t.orders;
  const badge = o.comingSoon;

  return [
    { id: "csv", label: o.actionExportCsv, disabled: true, badge },
    { id: "excel", label: o.actionExportExcel, disabled: true, badge },
    { id: "pdf", label: o.actionExportPdf, disabled: true, badge },
    { id: "reports", label: o.actionViewReports, disabled: true, badge },
    { id: "analytics", label: o.actionOpenAnalytics, disabled: true, badge },
  ];
}

function hasPosSync(input: DeriveOrdersInput): boolean {
  return input.data.devices.some((d) => Boolean(d.lastSeenAt?.trim()));
}

export function deriveOrdersState(input: DeriveOrdersInput): OrdersDerivedState {
  return {
    summary: deriveSummary(input),
    orders: [],
    receipts: [],
    payments: derivePayments(input),
    events: deriveEvents(input),
    quickActions: deriveQuickActions(input),
    hasPosSync: hasPosSync(input),
  };
}
