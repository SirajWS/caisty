import { describe, expect, it } from "vitest";

import {
  formatDeviceAccessDenial,
  formatPendingBindResponse,
  formatPendingVerifyResponse,
  httpStatusForDeviceAccessCode,
} from "../deviceAccessResponse.js";

describe("deviceAccessResponse Phase 2", () => {
  it("uses HTTP 403 for all access denial codes", () => {
    expect(httpStatusForDeviceAccessCode("DEVICE_PENDING_APPROVAL")).toBe(403);
    expect(httpStatusForDeviceAccessCode("DEVICE_RELEASED")).toBe(403);
  });

  it("formats pending bind without license or org data", () => {
    const body = formatPendingBindResponse({
      id: "dev-1",
      name: "Till 1",
      type: "pos",
    });
    expect(body).toEqual({
      ok: false,
      code: "DEVICE_PENDING_APPROVAL",
      message:
        "Device registered and waiting for approval in the customer portal.",
      device: {
        id: "dev-1",
        name: "Till 1",
        type: "pos",
        status: "pending_approval",
        licenseId: null,
      },
    });
    expect(body).not.toHaveProperty("license");
  });

  it("formats pending verify with minimal fields only", () => {
    const body = formatPendingVerifyResponse({ id: "dev-1" });
    expect(body).toEqual({
      ok: false,
      code: "DEVICE_PENDING_APPROVAL",
      message: "Device is waiting for customer portal approval.",
      device: {
        id: "dev-1",
        status: "pending_approval",
      },
    });
    expect(Object.keys(body.device)).toEqual(["id", "status"]);
  });

  it("formats generic access denial with code and message", () => {
    expect(
      formatDeviceAccessDenial({
        code: "DEVICE_RELEASED",
        message: "Device has been released from its license.",
      }),
    ).toEqual({
      ok: false,
      code: "DEVICE_RELEASED",
      message: "Device has been released from its license.",
    });
  });
});
