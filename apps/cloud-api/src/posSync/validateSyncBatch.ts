import type {
  PosSyncBatchRequest,
  PosSyncEvent,
  PosSyncEventType,
  PosSyncOrderPayload,
  PosSyncPaymentPayload,
  PosSyncReceiptEventPayload,
  PosSyncReceiptPayload,
  PosSyncShiftPayload,
  PosSyncChannelPayload,
} from "./types.js";
import {
  isPosSyncReceiptEventType,
  isSupportedReceiptEventSchemaVersion,
} from "../lib/receiptEventTypes.js";
import {
  isBusinessDate,
  isShiftStatus,
  isSupportedShiftSchemaVersion,
  SHIFT_STATUS,
} from "../lib/shiftTypes.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function parseIsoDate(value: string, field: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export type SyncBatchValidationError = {
  code: string;
  message: string;
};

export function validateSyncBatchRequest(
  body: unknown,
): { ok: true; request: PosSyncBatchRequest } | { ok: false; error: SyncBatchValidationError } {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      error: { code: "invalid_request", message: "Request body must be a JSON object." },
    };
  }

  const record = body as Record<string, unknown>;
  const deviceId = typeof record.deviceId === "string" ? record.deviceId.trim() : "";
  const licenseKey =
    typeof record.licenseKey === "string" ? record.licenseKey.trim() : "";

  if (!deviceId || !licenseKey) {
    return {
      ok: false,
      error: {
        code: "invalid_request",
        message: "deviceId and licenseKey are required.",
      },
    };
  }

  if (!isUuid(deviceId)) {
    return {
      ok: false,
      error: { code: "invalid_request", message: "deviceId must be a UUID." },
    };
  }

  const batchRaw = record.batch;
  if (!batchRaw || typeof batchRaw !== "object") {
    return {
      ok: false,
      error: { code: "invalid_request", message: "batch is required." },
    };
  }

  const batchObj = batchRaw as Record<string, unknown>;
  const batchId =
    typeof batchObj.batchId === "string" ? batchObj.batchId.trim() : "";

  if (!batchId || !isUuid(batchId)) {
    return {
      ok: false,
      error: {
        code: "invalid_request",
        message: "batch.batchId must be a UUID.",
      },
    };
  }

  const sequence =
    typeof batchObj.sequence === "number" && Number.isInteger(batchObj.sequence)
      ? batchObj.sequence
      : 1;

  const sentAt =
    typeof batchObj.sentAt === "string" ? batchObj.sentAt : undefined;

  if (sentAt && !parseIsoDate(sentAt, "batch.sentAt")) {
    return {
      ok: false,
      error: {
        code: "invalid_request",
        message: "batch.sentAt must be a valid ISO timestamp.",
      },
    };
  }

  if (!Array.isArray(record.events)) {
    return {
      ok: false,
      error: { code: "invalid_request", message: "events must be an array." },
    };
  }

  const events: PosSyncEvent[] = [];
  for (const [index, rawEvent] of record.events.entries()) {
    const validated = validateSyncEvent(rawEvent, index);
    if (!validated.ok) {
      return validated;
    }
    events.push(validated.event);
  }

  const telemetryRaw = record.telemetry;
  let telemetry: PosSyncBatchRequest["telemetry"];
  if (telemetryRaw && typeof telemetryRaw === "object") {
    const telemetryObj = telemetryRaw as Record<string, unknown>;
    telemetry = {
      appVersion:
        typeof telemetryObj.appVersion === "string"
          ? telemetryObj.appVersion.trim()
          : undefined,
      offlineQueueCount:
        typeof telemetryObj.offlineQueueCount === "number" &&
        Number.isInteger(telemetryObj.offlineQueueCount) &&
        telemetryObj.offlineQueueCount >= 0
          ? telemetryObj.offlineQueueCount
          : undefined,
    };
  }

  return {
    ok: true,
    request: {
      deviceId,
      licenseKey,
      batch: { batchId, sequence, sentAt },
      events,
      telemetry,
    },
  };
}

function validateSyncEvent(
  rawEvent: unknown,
  index: number,
):
  | { ok: true; event: PosSyncEvent }
  | { ok: false; error: SyncBatchValidationError } {
  if (!rawEvent || typeof rawEvent !== "object") {
    return {
      ok: false,
      error: {
        code: "invalid_request",
        message: `events[${index}] must be an object.`,
      },
    };
  }

  const eventObj = rawEvent as Record<string, unknown>;
  const eventId =
    typeof eventObj.eventId === "string" ? eventObj.eventId.trim() : "";
  const type = eventObj.type;

  if (!eventId || !isUuid(eventId)) {
    return {
      ok: false,
      error: {
        code: "invalid_request",
        message: `events[${index}].eventId must be a UUID.`,
      },
    };
  }

  if (
    type !== "order" &&
    type !== "receipt" &&
    type !== "payment" &&
    type !== "receipt_event" &&
    type !== "shift" &&
    type !== "channel"
  ) {
    return {
      ok: false,
      error: {
        code: "invalid_request",
        message: `events[${index}].type must be order, receipt, payment, receipt_event, shift, or channel.`,
      },
    };
  }

  const payloadResult = validateEventPayload(type, eventObj.payload, index, eventId);
  if (!payloadResult.ok) {
    return payloadResult;
  }

  return {
    ok: true,
    event: {
      eventId,
      type,
      payload: payloadResult.payload,
    },
  };
}

function validateEventPayload(
  type: PosSyncEventType,
  payload: unknown,
  index: number,
  syncEventId: string,
):
  | {
      ok: true;
      payload:
        | PosSyncOrderPayload
        | PosSyncReceiptPayload
        | PosSyncPaymentPayload
        | PosSyncReceiptEventPayload
        | PosSyncShiftPayload
        | PosSyncChannelPayload;
    }
  | { ok: false; error: SyncBatchValidationError } {
  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      error: {
        code: "invalid_request",
        message: `events[${index}].payload is required.`,
      },
    };
  }

  const payloadObj = payload as Record<string, unknown>;

  if (type === "order") {
    const localOrderId =
      typeof payloadObj.localOrderId === "string"
        ? payloadObj.localOrderId.trim()
        : "";
    const totalCents = payloadObj.totalCents;
    const soldAt =
      typeof payloadObj.soldAt === "string" ? payloadObj.soldAt : "";

    if (!localOrderId) {
      return invalidPayload(index, "localOrderId is required for order events.");
    }
    if (typeof totalCents !== "number" || !Number.isInteger(totalCents)) {
      return invalidPayload(index, "totalCents must be an integer.");
    }
    if (!soldAt || !parseIsoDate(soldAt, "soldAt")) {
      return invalidPayload(index, "soldAt must be a valid ISO timestamp.");
    }

    const status =
      typeof payloadObj.status === "string" && payloadObj.status.trim()
        ? payloadObj.status.trim().slice(0, 32)
        : undefined;

    const optionalText = (field: string): string | undefined => {
      const value = payloadObj[field];
      return typeof value === "string" && value.trim()
        ? value.trim()
        : undefined;
    };

    return {
      ok: true,
      payload: {
        localOrderId,
        status,
        totalCents,
        currency:
          typeof payloadObj.currency === "string"
            ? payloadObj.currency.trim().toUpperCase()
            : undefined,
        soldAt,
        lines: Array.isArray(payloadObj.lines)
          ? payloadObj.lines
              .map((line, lineIndex) => validateOrderLine(line, lineIndex))
              .filter((line): line is NonNullable<typeof line> => line !== null)
          : undefined,
        platform: optionalText("platform"),
        providerOrderId: optionalText("providerOrderId"),
        customerName: optionalText("customerName"),
        customerPhone: optionalText("customerPhone"),
        customerEmail: optionalText("customerEmail"),
        deliveryAddress: optionalText("deliveryAddress"),
        customerNote: optionalText("customerNote"),
        paymentStatus: optionalText("paymentStatus"),
      },
    };
  }

  if (type === "receipt") {
    const localReceiptId =
      typeof payloadObj.localReceiptId === "string"
        ? payloadObj.localReceiptId.trim()
        : "";
    const netCents = payloadObj.netCents;
    const grossCents = payloadObj.grossCents;
    const soldAt =
      typeof payloadObj.soldAt === "string" ? payloadObj.soldAt : "";

    if (!localReceiptId) {
      return invalidPayload(index, "localReceiptId is required for receipt events.");
    }
    if (typeof netCents !== "number" || !Number.isInteger(netCents)) {
      return invalidPayload(index, "netCents must be an integer.");
    }
    if (typeof grossCents !== "number" || !Number.isInteger(grossCents)) {
      return invalidPayload(index, "grossCents must be an integer.");
    }
    if (!soldAt || !parseIsoDate(soldAt, "soldAt")) {
      return invalidPayload(index, "soldAt must be a valid ISO timestamp.");
    }

    const taxCents =
      typeof payloadObj.taxCents === "number" && Number.isInteger(payloadObj.taxCents)
        ? payloadObj.taxCents
        : 0;

    const fiscalStatus =
      payloadObj.fiscalStatus === "pending" ||
      payloadObj.fiscalStatus === "signed" ||
      payloadObj.fiscalStatus === "failed"
        ? payloadObj.fiscalStatus
        : undefined;

    return {
      ok: true,
      payload: {
        localReceiptId,
        localOrderId:
          typeof payloadObj.localOrderId === "string"
            ? payloadObj.localOrderId.trim()
            : undefined,
        receiptNumber:
          typeof payloadObj.receiptNumber === "string"
            ? payloadObj.receiptNumber.trim()
            : undefined,
        netCents,
        taxCents,
        grossCents,
        currency:
          typeof payloadObj.currency === "string"
            ? payloadObj.currency.trim().toUpperCase()
            : undefined,
        soldAt,
        fiscalStatus,
      },
    };
  }

  if (type === "receipt_event") {
    const payloadEventId =
      typeof payloadObj.eventId === "string" ? payloadObj.eventId.trim() : "";
    const eventId =
      payloadEventId && isUuid(payloadEventId) ? payloadEventId : syncEventId;

    if (!isUuid(eventId)) {
      return invalidPayload(index, "eventId must be a UUID.");
    }

    const eventType =
      typeof payloadObj.eventType === "string"
        ? payloadObj.eventType.trim()
        : "";
    if (!isPosSyncReceiptEventType(eventType)) {
      return invalidPayload(
        index,
        "eventType must be created, printed, or reprinted.",
      );
    }

    const localReceiptId =
      typeof payloadObj.localReceiptId === "string"
        ? payloadObj.localReceiptId.trim()
        : "";
    if (!localReceiptId) {
      return invalidPayload(index, "localReceiptId is required for receipt_event.");
    }

    const occurredAt =
      typeof payloadObj.occurredAt === "string" ? payloadObj.occurredAt : "";
    if (!occurredAt || !parseIsoDate(occurredAt, "occurredAt")) {
      return invalidPayload(index, "occurredAt must be a valid ISO timestamp.");
    }

    const schemaVersion = payloadObj.schemaVersion;
    if (
      typeof schemaVersion !== "number" ||
      !Number.isInteger(schemaVersion) ||
      !isSupportedReceiptEventSchemaVersion(schemaVersion)
    ) {
      return invalidPayload(
        index,
        "schemaVersion must be a supported integer (currently 1).",
      );
    }

    const actor =
      typeof payloadObj.actor === "string" ? payloadObj.actor.trim() : undefined;

    let eventPayload: Record<string, unknown> | undefined;
    const rawPayload = payloadObj.payload ?? payloadObj.data;
    if (rawPayload !== undefined) {
      if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
        return invalidPayload(index, "payload must be a JSON object when provided.");
      }
      eventPayload = rawPayload as Record<string, unknown>;
    }

    return {
      ok: true,
      payload: {
        eventId,
        eventType,
        localReceiptId,
        occurredAt,
        schemaVersion,
        actor: actor || undefined,
        payload: eventPayload,
        receiptNumber:
          typeof payloadObj.receiptNumber === "string"
            ? payloadObj.receiptNumber.trim()
            : undefined,
      },
    };
  }

  if (type === "shift") {
    const localShiftId =
      typeof payloadObj.localShiftId === "string"
        ? payloadObj.localShiftId.trim()
        : "";
    if (!localShiftId) {
      return invalidPayload(index, "localShiftId is required for shift events.");
    }

    const status =
      typeof payloadObj.status === "string" ? payloadObj.status.trim() : "";
    if (!isShiftStatus(status)) {
      return invalidPayload(index, "status must be open or closed.");
    }

    const businessDate =
      typeof payloadObj.businessDate === "string"
        ? payloadObj.businessDate.trim()
        : "";
    if (!businessDate || !isBusinessDate(businessDate)) {
      return invalidPayload(
        index,
        "businessDate must be a valid YYYY-MM-DD date.",
      );
    }

    const startedAt =
      typeof payloadObj.startedAt === "string" ? payloadObj.startedAt : "";
    if (!startedAt || !parseIsoDate(startedAt, "startedAt")) {
      return invalidPayload(index, "startedAt must be a valid ISO timestamp.");
    }

    const endedAtRaw = payloadObj.endedAt;
    const endedAt =
      endedAtRaw === null || endedAtRaw === undefined
        ? null
        : typeof endedAtRaw === "string"
          ? endedAtRaw
          : "";

    if (status === SHIFT_STATUS.CLOSED) {
      if (!endedAt || !parseIsoDate(endedAt, "endedAt")) {
        return invalidPayload(
          index,
          "endedAt is required for closed shift events.",
        );
      }
    } else if (endedAt !== null && endedAt !== "" && !parseIsoDate(endedAt, "endedAt")) {
      return invalidPayload(index, "endedAt must be null or a valid ISO timestamp.");
    }

    const openingFloatMinor = payloadObj.openingFloatMinor;
    if (
      typeof openingFloatMinor !== "number" ||
      !Number.isInteger(openingFloatMinor) ||
      openingFloatMinor < 0
    ) {
      return invalidPayload(
        index,
        "openingFloatMinor must be a non-negative integer.",
      );
    }

    const parseOptionalMinor = (
      field: string,
      value: unknown,
    ): number | null | undefined => {
      if (value === null || value === undefined) return null;
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        return undefined;
      }
      return value;
    };

    const closingFloatMinor = parseOptionalMinor(
      "closingFloatMinor",
      payloadObj.closingFloatMinor,
    );
    if (closingFloatMinor === undefined) {
      return invalidPayload(
        index,
        "closingFloatMinor must be a non-negative integer or null.",
      );
    }

    const previousClosingFloatMinor = parseOptionalMinor(
      "previousClosingFloatMinor",
      payloadObj.previousClosingFloatMinor,
    );
    if (previousClosingFloatMinor === undefined) {
      return invalidPayload(
        index,
        "previousClosingFloatMinor must be a non-negative integer or null.",
      );
    }

    const schemaVersion = payloadObj.schemaVersion;
    if (
      typeof schemaVersion !== "number" ||
      !Number.isInteger(schemaVersion) ||
      !isSupportedShiftSchemaVersion(schemaVersion)
    ) {
      return invalidPayload(
        index,
        "schemaVersion must be a supported integer (currently 1).",
      );
    }

    const currencyRaw =
      typeof payloadObj.currency === "string"
        ? payloadObj.currency.trim().toUpperCase()
        : "EUR";
    if (!/^[A-Z]{3}$/.test(currencyRaw)) {
      return invalidPayload(index, "currency must be a 3-letter ISO code.");
    }

    const cashier =
      typeof payloadObj.cashier === "string"
        ? payloadObj.cashier.trim()
        : undefined;

    return {
      ok: true,
      payload: {
        localShiftId,
        status,
        cashier: cashier || undefined,
        businessDate,
        startedAt,
        endedAt: status === SHIFT_STATUS.CLOSED ? endedAt! : null,
        openingFloatMinor,
        closingFloatMinor,
        previousClosingFloatMinor,
        currency: currencyRaw,
        schemaVersion,
      },
    };
  }

  if (type === "channel") {
    const op = payloadObj.op;
    const channelId =
      typeof payloadObj.channelId === "string"
        ? payloadObj.channelId.trim()
        : typeof payloadObj.entityId === "string"
          ? payloadObj.entityId.trim()
          : "";
    const clientUpdatedAt =
      typeof payloadObj.clientUpdatedAt === "string"
        ? payloadObj.clientUpdatedAt
        : "";

    if (op !== "upsert" && op !== "delete") {
      return invalidPayload(index, "op must be upsert or delete for channel events.");
    }
    if (!channelId || !isUuid(channelId)) {
      return invalidPayload(index, "channelId must be a UUID for channel events.");
    }
    if (!clientUpdatedAt || !parseIsoDate(clientUpdatedAt, "clientUpdatedAt")) {
      return invalidPayload(
        index,
        "clientUpdatedAt must be a valid ISO timestamp for channel events.",
      );
    }

    return {
      ok: true,
      payload: {
        op,
        channelId,
        clientUpdatedAt,
        ...(typeof payloadObj.name === "string" ? { name: payloadObj.name } : {}),
        ...(typeof payloadObj.slug === "string" ? { slug: payloadObj.slug } : {}),
        ...(typeof payloadObj.enabled === "boolean"
          ? { enabled: payloadObj.enabled }
          : {}),
        ...(typeof payloadObj.status === "string"
          ? { status: payloadObj.status }
          : {}),
        ...(typeof payloadObj.provider === "string"
          ? { provider: payloadObj.provider }
          : {}),
        ...(typeof payloadObj.mode === "string" ? { mode: payloadObj.mode } : {}),
        ...(payloadObj.mode === null ? { mode: null } : {}),
        ...(typeof payloadObj.storeId === "string"
          ? { storeId: payloadObj.storeId }
          : {}),
        ...(payloadObj.storeId === null ? { storeId: null } : {}),
        ...(typeof payloadObj.providerStoreId === "string"
          ? { providerStoreId: payloadObj.providerStoreId }
          : {}),
        ...(payloadObj.statusMapping &&
        typeof payloadObj.statusMapping === "object" &&
        !Array.isArray(payloadObj.statusMapping)
          ? {
              statusMapping: payloadObj.statusMapping as Record<string, unknown>,
            }
          : {}),
        ...(payloadObj.statusMap &&
        typeof payloadObj.statusMap === "object" &&
        !Array.isArray(payloadObj.statusMap)
          ? { statusMap: payloadObj.statusMap as Record<string, unknown> }
          : {}),
        ...(typeof payloadObj.notes === "string" ? { notes: payloadObj.notes } : {}),
        ...(payloadObj.notes === null ? { notes: null } : {}),
        ...(payloadObj.logoDataUrl === null ||
        typeof payloadObj.logoDataUrl === "string"
          ? { logoDataUrl: payloadObj.logoDataUrl as string | null }
          : {}),
        ...(payloadObj.publicSettings &&
        typeof payloadObj.publicSettings === "object" &&
        !Array.isArray(payloadObj.publicSettings)
          ? {
              publicSettings: payloadObj.publicSettings as Record<string, unknown>,
            }
          : {}),
        ...(typeof payloadObj.createdAt === "string"
          ? { createdAt: payloadObj.createdAt }
          : {}),
      },
    };
  }

  if (type !== "payment") {
    return invalidPayload(index, "Unsupported event payload type.");
  }

  const localPaymentId =
    typeof payloadObj.localPaymentId === "string"
      ? payloadObj.localPaymentId.trim()
      : "";
  const method =
    typeof payloadObj.method === "string" ? payloadObj.method.trim() : "";
  const amountCents = payloadObj.amountCents;
  const paidAt =
    typeof payloadObj.paidAt === "string" ? payloadObj.paidAt : "";

  if (!localPaymentId) {
    return invalidPayload(index, "localPaymentId is required for payment events.");
  }
  if (!method) {
    return invalidPayload(index, "method is required for payment events.");
  }
  if (typeof amountCents !== "number" || !Number.isInteger(amountCents)) {
    return invalidPayload(index, "amountCents must be an integer.");
  }
  if (!paidAt || !parseIsoDate(paidAt, "paidAt")) {
    return invalidPayload(index, "paidAt must be a valid ISO timestamp.");
  }

  return {
    ok: true,
    payload: {
      localPaymentId,
      localOrderId:
        typeof payloadObj.localOrderId === "string"
          ? payloadObj.localOrderId.trim()
          : undefined,
      localReceiptId:
        typeof payloadObj.localReceiptId === "string"
          ? payloadObj.localReceiptId.trim()
          : undefined,
      method,
      amountCents,
      currency:
        typeof payloadObj.currency === "string"
          ? payloadObj.currency.trim().toUpperCase()
          : undefined,
      paidAt,
    },
  };
}

function validateOrderLine(line: unknown, lineIndex: number) {
  if (!line || typeof line !== "object") {
    return null;
  }
  const lineObj = line as Record<string, unknown>;
  const quantity = lineObj.quantity;
  const unitPriceCents = lineObj.unitPriceCents;
  const lineTotalCents = lineObj.lineTotalCents;

  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    typeof unitPriceCents !== "number" ||
    !Number.isInteger(unitPriceCents) ||
    typeof lineTotalCents !== "number" ||
    !Number.isInteger(lineTotalCents)
  ) {
    return null;
  }

  const index =
    typeof lineObj.lineIndex === "number" && Number.isInteger(lineObj.lineIndex)
      ? lineObj.lineIndex
      : lineIndex;

  return {
    lineIndex: index,
    productName:
      typeof lineObj.productName === "string" ? lineObj.productName : undefined,
    sku: typeof lineObj.sku === "string" ? lineObj.sku : undefined,
    quantity,
    unitPriceCents,
    lineTotalCents,
    taxRateBps:
      typeof lineObj.taxRateBps === "number" && Number.isInteger(lineObj.taxRateBps)
        ? lineObj.taxRateBps
        : undefined,
  };
}

function invalidPayload(index: number, message: string) {
  return {
    ok: false as const,
    error: {
      code: "invalid_request",
      message: `events[${index}].payload: ${message}`,
    },
  };
}
