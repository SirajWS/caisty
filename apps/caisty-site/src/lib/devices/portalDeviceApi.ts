import {
  clearPortalToken,
  getStoredPortalToken,
} from "../portalApi";

const RAW_API_BASE =
  import.meta.env.VITE_CLOUD_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3333" : "https://api.caisty.com");
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export type PortalDeviceAllowedAction =
  | "approve"
  | "reject"
  | "block"
  | "unblock"
  | "release";

export type PortalDeviceManagementSummary = {
  plan: string | null;
  maxDevices: number | null;
  unlimitedDevices: boolean;
  usedSeats: number;
  activeCount: number;
  blockedCount: number;
  pendingCount: number;
  rejectedCount: number;
  releasedCount: number;
  remainingSeats: number;
  overLimit: boolean;
};

export type PortalDeviceManagementDevice = {
  id: string;
  name: string;
  type: string;
  lifecycleStatus: string;
  connectivityStatus: "online" | "offline" | "never_seen";
  licenseId: string | null;
  pendingLicenseId: string | null;
  licensePlan: string | null;
  fingerprintMasked: string | null;
  appVersion: string | null;
  createdAt: string;
  approvedAt: string | null;
  blockedAt: string | null;
  rejectedAt: string | null;
  releasedAt: string | null;
  allowedActions: PortalDeviceAllowedAction[];
};

export type PortalDeviceManagementResponse = {
  ok: true;
  summary: PortalDeviceManagementSummary;
  devices: PortalDeviceManagementDevice[];
};

export type PortalDeviceActionKind =
  | "approve"
  | "reject"
  | "block"
  | "unblock"
  | "release";

export type PortalDeviceApiErrorCode =
  | "DEVICE_NOT_FOUND"
  | "DEVICE_INVALID_TRANSITION"
  | "DEVICE_LIMIT_REACHED"
  | "DEVICE_LICENSE_INVALID"
  | "DEVICE_LICENSE_MISMATCH"
  | "DEVICE_ORG_MISMATCH"
  | "not_found"
  | "forbidden"
  | "already_released"
  | "invalid_transition"
  | "not_bound"
  | "release_failed"
  | "NETWORK"
  | "UNAUTHORIZED"
  | "SERVICE_UNAVAILABLE"
  | "UNKNOWN";

const FASTIFY_ROUTE_NOT_FOUND = /^Route (GET|POST|PUT|PATCH|DELETE):/i;

/** Strip internal Fastify route diagnostics from user-visible API messages. */
export function sanitizeDeviceApiMessage(
  message: string | undefined,
  httpStatus: number,
): { message: string; code?: string } {
  const raw = message?.trim() ?? "";
  if (
    httpStatus === 404 &&
    (FASTIFY_ROUTE_NOT_FOUND.test(raw) || raw.toLowerCase().includes("not found"))
  ) {
    return {
      message: "",
      code: "SERVICE_UNAVAILABLE",
    };
  }
  if (
    httpStatus >= 500 &&
    (raw.toLowerCase().includes("column ") ||
      raw.toLowerCase().includes("does not exist") ||
      raw.toLowerCase().includes("failed to load"))
  ) {
    return {
      message: "",
      code: "SERVICE_UNAVAILABLE",
    };
  }
  if (FASTIFY_ROUTE_NOT_FOUND.test(raw)) {
    return {
      message: "",
      code: "SERVICE_UNAVAILABLE",
    };
  }
  return { message: raw };
}

export class PortalDeviceApiError extends Error {
  readonly code: PortalDeviceApiErrorCode;
  readonly httpStatus: number;
  readonly maxDevices?: number | null;
  readonly usedSeats?: number;
  readonly remainingSeats?: number;
  readonly shouldReload: boolean;

  constructor(input: {
    message: string;
    code?: string;
    httpStatus: number;
    maxDevices?: number | null;
    usedSeats?: number;
    remainingSeats?: number;
  }) {
    super(input.message);
    this.name = "PortalDeviceApiError";
    this.httpStatus = input.httpStatus;
    this.maxDevices = input.maxDevices;
    this.usedSeats = input.usedSeats;
    this.remainingSeats = input.remainingSeats;
    this.code = normalizeDeviceErrorCode(input.code, input.httpStatus);
    this.shouldReload = shouldReloadForCode(this.code);
  }
}

function normalizeDeviceErrorCode(
  code: string | undefined,
  httpStatus: number,
): PortalDeviceApiErrorCode {
  switch (code) {
    case "DEVICE_NOT_FOUND":
    case "DEVICE_INVALID_TRANSITION":
    case "DEVICE_LIMIT_REACHED":
    case "DEVICE_LICENSE_INVALID":
    case "DEVICE_LICENSE_MISMATCH":
    case "DEVICE_ORG_MISMATCH":
    case "not_found":
    case "forbidden":
    case "already_released":
    case "invalid_transition":
    case "not_bound":
    case "release_failed":
    case "SERVICE_UNAVAILABLE":
      return code;
    default:
      if (httpStatus === 401) return "UNAUTHORIZED";
      if (httpStatus === 404) return "SERVICE_UNAVAILABLE";
      return "UNKNOWN";
  }
}

function shouldReloadForCode(code: PortalDeviceApiErrorCode): boolean {
  return (
    code === "DEVICE_INVALID_TRANSITION" ||
    code === "DEVICE_NOT_FOUND" ||
    code === "DEVICE_LIMIT_REACHED" ||
    code === "already_released" ||
    code === "invalid_transition" ||
    code === "not_found"
  );
}

async function portalDeviceFetch<T>(
  method: "GET" | "POST",
  path: string,
): Promise<T> {
  const token = getStoredPortalToken();
  if (!token) {
    throw new PortalDeviceApiError({
      message: "Not signed in.",
      code: "UNAUTHORIZED",
      httpStatus: 401,
    });
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new PortalDeviceApiError({
      message: "Connection problem.",
      code: "NETWORK",
      httpStatus: 0,
    });
  }

  if (res.status === 401) {
    clearPortalToken();
    throw new PortalDeviceApiError({
      message: "Session expired.",
      code: "UNAUTHORIZED",
      httpStatus: 401,
    });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    if (!res.ok) {
      throw new PortalDeviceApiError({
        message: "Unexpected server response.",
        httpStatus: res.status,
      });
    }
  }

  if (!res.ok) {
    const rawMessage =
      typeof body.message === "string" ? body.message : "Request failed.";
    const sanitized = sanitizeDeviceApiMessage(rawMessage, res.status);
    throw new PortalDeviceApiError({
      message: sanitized.message || rawMessage,
      code:
        sanitized.code ??
        (typeof body.code === "string" ? body.code : undefined),
      httpStatus: res.status,
      maxDevices:
        body.maxDevices === null || typeof body.maxDevices === "number"
          ? (body.maxDevices as number | null)
          : undefined,
      usedSeats:
        typeof body.usedSeats === "number" ? body.usedSeats : undefined,
      remainingSeats:
        typeof body.remainingSeats === "number"
          ? body.remainingSeats
          : undefined,
    });
  }

  return body as T;
}

export async function fetchPortalDeviceManagement(): Promise<PortalDeviceManagementResponse> {
  return portalDeviceFetch<PortalDeviceManagementResponse>(
    "GET",
    "/portal/devices/management",
  );
}

const ACTION_PATH: Record<PortalDeviceActionKind, string> = {
  approve: "approve",
  reject: "reject",
  block: "block",
  unblock: "unblock",
  release: "release",
};

export async function runPortalDeviceAction(
  deviceId: string,
  action: PortalDeviceActionKind,
): Promise<Record<string, unknown>> {
  const segment = ACTION_PATH[action];
  return portalDeviceFetch(
    "POST",
    `/portal/devices/${encodeURIComponent(deviceId)}/${segment}`,
  );
}

export type DeviceErrorLabels = {
  default: string;
  unauthorized: string;
  network: string;
  notFound: string;
  invalidTransition: string;
  limitReached: string;
  licenseInvalid: string;
  orgMismatch: string;
  releaseFailed: string;
  serviceUnavailable: string;
};

export function formatDeviceApiError(
  err: unknown,
  labels: DeviceErrorLabels,
  limitHint?: (used: number, max: number | null, remaining: number) => string,
): string {
  if (err instanceof PortalDeviceApiError) {
    if (err.code === "UNAUTHORIZED") return labels.unauthorized;
    if (err.code === "NETWORK") return labels.network;
    if (err.code === "SERVICE_UNAVAILABLE") return labels.serviceUnavailable;
    if (err.code === "DEVICE_NOT_FOUND" || err.code === "not_found") {
      return labels.notFound;
    }
    if (
      err.code === "DEVICE_INVALID_TRANSITION" ||
      err.code === "invalid_transition" ||
      err.code === "already_released"
    ) {
      return labels.invalidTransition;
    }
    if (err.code === "DEVICE_LIMIT_REACHED") {
      if (
        limitHint &&
        err.usedSeats !== undefined &&
        err.remainingSeats !== undefined
      ) {
        return limitHint(
          err.usedSeats,
          err.maxDevices ?? null,
          err.remainingSeats,
        );
      }
      return labels.limitReached;
    }
    if (
      err.code === "DEVICE_LICENSE_INVALID" ||
      err.code === "DEVICE_LICENSE_MISMATCH"
    ) {
      return labels.licenseInvalid;
    }
    if (err.code === "DEVICE_ORG_MISMATCH" || err.code === "forbidden") {
      return labels.orgMismatch;
    }
    if (err.code === "release_failed" || err.code === "not_bound") {
      return labels.releaseFailed;
    }
    return err.message || labels.default;
  }
  return labels.default;
}
