import { describe, expect, it } from "vitest";
import {
  formatDeviceApiError,
  PortalDeviceApiError,
  sanitizeDeviceApiMessage,
} from "./portalDeviceApi";

const labels = {
  default: "Default error",
  unauthorized: "Unauthorized",
  network: "Network",
  notFound: "Not found",
  invalidTransition: "Invalid transition",
  limitReached: "Limit reached",
  licenseInvalid: "License invalid",
  orgMismatch: "Org mismatch",
  releaseFailed: "Release failed",
  serviceUnavailable: "Service unavailable",
};
describe("sanitizeDeviceApiMessage", () => {
  it("maps Fastify route-not-found to SERVICE_UNAVAILABLE", () => {
    expect(
      sanitizeDeviceApiMessage(
        "Route GET:/portal/devices/management not found",
        404,
      ),
    ).toEqual({ message: "", code: "SERVICE_UNAVAILABLE" });
  });

  it("maps internal schema/server failures to SERVICE_UNAVAILABLE", () => {
    expect(
      sanitizeDeviceApiMessage('column "pending_license_id" does not exist', 500),
    ).toEqual({ message: "", code: "SERVICE_UNAVAILABLE" });
  });

  it("leaves business error messages unchanged", () => {
    expect(
      sanitizeDeviceApiMessage("Device approval failed.", 500),
    ).toEqual({ message: "Device approval failed." });
  });
});

describe("formatDeviceApiError", () => {
  it("maps SERVICE_UNAVAILABLE to neutral label", () => {
    const err = new PortalDeviceApiError({
      message: "Route GET:/portal/devices/management not found",
      code: "SERVICE_UNAVAILABLE",
      httpStatus: 404,
    });
    expect(formatDeviceApiError(err, labels)).toBe("Service unavailable");
  });

  it("maps DEVICE_LIMIT_REACHED with seat details", () => {
    const err = new PortalDeviceApiError({
      message: "limit",
      code: "DEVICE_LIMIT_REACHED",
      httpStatus: 409,
      maxDevices: 3,
      usedSeats: 3,
      remainingSeats: 0,
    });
    expect(
      formatDeviceApiError(
        err,
        labels,
        (used, max, remaining) => `${used}/${max}/${remaining}`,
      ),
    ).toBe("3/3/0");
  });

  it("maps invalid transition for stale UI reload", () => {
    const err = new PortalDeviceApiError({
      message: "stale",
      code: "DEVICE_INVALID_TRANSITION",
      httpStatus: 409,
    });
    expect(formatDeviceApiError(err, labels)).toBe("Invalid transition");
    expect(err.shouldReload).toBe(true);
  });

  it("maps not found without tenant details", () => {
    const err = new PortalDeviceApiError({
      message: "missing",
      code: "DEVICE_NOT_FOUND",
      httpStatus: 404,
    });
    expect(formatDeviceApiError(err, labels)).toBe("Not found");
  });
});

describe("PortalDeviceApiError", () => {
  it("marks unauthorized responses", () => {
    const err = new PortalDeviceApiError({
      message: "Session expired.",
      httpStatus: 401,
    });
    expect(err.code).toBe("UNAUTHORIZED");
  });
});
