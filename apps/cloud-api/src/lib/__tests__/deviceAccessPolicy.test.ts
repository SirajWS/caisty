import { describe, expect, it } from "vitest";

import {
  DEVICE_STATUS,
  evaluateDevicePosAccess,
} from "../deviceAccessPolicy.js";

const license = { id: "lic-1", orgId: "org-1" };

function ctx(
  device: Partial<{
    orgId: string;
    status: string;
    licenseId: string | null;
  }>,
) {
  return {
    device: {
      orgId: "org-1",
      status: DEVICE_STATUS.ACTIVE,
      licenseId: "lic-1",
      ...device,
    },
    license,
  };
}

describe("evaluateDevicePosAccess", () => {
  it("allows active device with matching license and org", () => {
    expect(evaluateDevicePosAccess(ctx({}))).toEqual({ allowed: true });
  });

  it("denies active device without licenseId", () => {
    const result = evaluateDevicePosAccess(
      ctx({ licenseId: null }),
    );
    expect(result).toEqual({
      allowed: false,
      code: "DEVICE_NOT_BOUND",
      message: "Active device is not bound to a license.",
    });
  });

  it("denies active device bound to a different license", () => {
    const result = evaluateDevicePosAccess(
      ctx({ licenseId: "lic-other" }),
    );
    expect(result).toEqual({
      allowed: false,
      code: "DEVICE_LICENSE_MISMATCH",
      message: "Device is not bound to the provided license.",
    });
  });

  it("denies active device with mismatched organization", () => {
    const result = evaluateDevicePosAccess(
      ctx({ orgId: "org-other" }),
    );
    expect(result).toEqual({
      allowed: false,
      code: "DEVICE_ORG_MISMATCH",
      message: "Device organization does not match the license organization.",
    });
  });

  it("denies pending_approval", () => {
    const result = evaluateDevicePosAccess(
      ctx({ status: DEVICE_STATUS.PENDING_APPROVAL, licenseId: null }),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.code).toBe("DEVICE_PENDING_APPROVAL");
    }
  });

  it("denies blocked", () => {
    const result = evaluateDevicePosAccess(
      ctx({ status: DEVICE_STATUS.BLOCKED }),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.code).toBe("DEVICE_BLOCKED");
    }
  });

  it("denies rejected", () => {
    const result = evaluateDevicePosAccess(
      ctx({ status: DEVICE_STATUS.REJECTED, licenseId: null }),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.code).toBe("DEVICE_REJECTED");
    }
  });

  it("denies released", () => {
    const result = evaluateDevicePosAccess(
      ctx({ status: DEVICE_STATUS.RELEASED, licenseId: null }),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.code).toBe("DEVICE_RELEASED");
    }
  });

  it("denies unknown status", () => {
    const result = evaluateDevicePosAccess(
      ctx({ status: "legacy_custom" }),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.code).toBe("DEVICE_INVALID_STATUS");
    }
  });
});
