import type {
  PosSyncBatchRequest,
  PosSyncEvent,
  PosSyncEventType,
  PosSyncOrderPayload,
  PosSyncPaymentPayload,
  PosSyncReceiptPayload,
} from "./types.js";

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

  if (type !== "order" && type !== "receipt" && type !== "payment") {
    return {
      ok: false,
      error: {
        code: "invalid_request",
        message: `events[${index}].type must be order, receipt, or payment.`,
      },
    };
  }

  const payloadResult = validateEventPayload(type, eventObj.payload, index);
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
):
  | {
      ok: true;
      payload:
        | PosSyncOrderPayload
        | PosSyncReceiptPayload
        | PosSyncPaymentPayload;
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
      payloadObj.status === "open" ||
      payloadObj.status === "closed" ||
      payloadObj.status === "cancelled"
        ? payloadObj.status
        : undefined;

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
