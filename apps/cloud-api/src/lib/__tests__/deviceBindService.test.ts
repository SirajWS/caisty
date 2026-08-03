import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  return { mockSelect, mockUpdate, mockInsert };
});

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    update: mocks.mockUpdate,
    insert: mocks.mockInsert,
  },
}));

import {
  bindDeviceRequest,
  findDevicesByFingerprintInTenant,
} from "../deviceBindService.js";
import { DEVICE_STATUS } from "../deviceAccessPolicy.js";
import { DEVICE_RELEASED_STATUS } from "../deviceLifecycleService.js";

const license = {
  id: "lic-1",
  orgId: "org-1",
  customerId: "cust-1",
  key: "KEY-1",
  plan: "starter",
  maxDevices: 1,
  status: "active",
  validFrom: new Date("2020-01-01"),
  validUntil: new Date("2099-01-01"),
  createdAt: new Date(),
  updatedAt: new Date(),
  subscriptionId: null,
};

function chainSelect(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
}

function chainSelectAll(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
  };
}

function chainUpdate(returning: unknown[]) {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returning),
  };
  mocks.mockUpdate.mockReturnValue(chain);
  return chain;
}

function chainInsert(returning: unknown[]) {
  const returningChain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returning),
  };
  const deviceInsert = {
    values: vi.fn().mockReturnValue(returningChain),
  };
  const eventInsert = {
    values: vi.fn().mockResolvedValue(undefined),
  };
  mocks.mockInsert
    .mockReturnValueOnce(deviceInsert)
    .mockReturnValueOnce(eventInsert);
  return returningChain;
}

describe("bindDeviceRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockLicenseThenFingerprint(
    licenseRows: unknown[],
    fingerprintRows: unknown[],
  ) {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect(licenseRows))
      .mockReturnValueOnce(chainSelectAll(fingerprintRows));
  }

  it("creates pending_approval with null license_id and pending_license_id set", async () => {
    mockLicenseThenFingerprint([license], []);
    const pendingDevice = {
      id: "dev-pending-1",
      orgId: "org-1",
      customerId: "cust-1",
      name: "Till 1",
      type: "pos",
      status: DEVICE_STATUS.PENDING_APPROVAL,
      licenseId: null,
      pendingLicenseId: "lic-1",
      fingerprint: "fp-1",
      lastHeartbeatAt: null,
      lastSeenAt: new Date(),
      createdAt: new Date(),
      releasedAt: null,
      approvedAt: null,
      blockedAt: null,
      rejectedAt: null,
    };
    chainInsert([pendingDevice]);

    const result = await bindDeviceRequest({
      licenseKey: "KEY-1",
      deviceName: "Till 1",
      fingerprint: "fp-1",
    });

    expect(result.kind).toBe("pending");
    if (result.kind === "pending") {
      expect(result.httpStatus).toBe(202);
      expect(result.created).toBe(true);
      expect(result.device.status).toBe(DEVICE_STATUS.PENDING_APPROVAL);
      expect(result.device.licenseId).toBeNull();
      expect(result.device.pendingLicenseId).toBe("lic-1");
    }
  });

  it("returns idempotent pending for same fingerprint and license", async () => {
    const existingPending = {
      id: "dev-pending-1",
      orgId: "org-1",
      customerId: "cust-1",
      name: "Old name",
      type: "pos",
      status: DEVICE_STATUS.PENDING_APPROVAL,
      licenseId: null,
      pendingLicenseId: "lic-1",
      fingerprint: "fp-1",
    };
    mockLicenseThenFingerprint([license], [existingPending]);
    chainUpdate([
      {
        ...existingPending,
        name: "Till 1",
      },
    ]);

    const result = await bindDeviceRequest({
      licenseKey: "KEY-1",
      deviceName: "Till 1",
      fingerprint: "fp-1",
    });

    expect(result.kind).toBe("pending");
    if (result.kind === "pending") {
      expect(result.created).toBe(false);
      expect(result.device.id).toBe("dev-pending-1");
    }
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it("keeps existing active device active on re-bind", async () => {
    const activeDevice = {
      id: "dev-active-1",
      orgId: "org-1",
      customerId: "cust-1",
      name: "Till 1",
      type: "pos",
      status: DEVICE_STATUS.ACTIVE,
      licenseId: "lic-1",
      pendingLicenseId: null,
      fingerprint: "fp-1",
      lastHeartbeatAt: new Date("2026-01-01"),
      lastSeenAt: new Date("2026-01-01"),
      createdAt: new Date(),
    };
    mockLicenseThenFingerprint([license], [activeDevice]);
    chainUpdate([activeDevice]);

    const result = await bindDeviceRequest({
      licenseKey: "KEY-1",
      deviceName: "Till 1",
      fingerprint: "fp-1",
    });

    expect(result.kind).toBe("active");
    if (result.kind === "active") {
      expect(result.device.status).toBe(DEVICE_STATUS.ACTIVE);
      expect(result.device.licenseId).toBe("lic-1");
    }
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it("rejects bind when active device is on a different license", async () => {
    mockLicenseThenFingerprint([license], [
      {
        id: "dev-active-other",
        orgId: "org-1",
        customerId: "cust-1",
        status: DEVICE_STATUS.ACTIVE,
        licenseId: "lic-other",
        fingerprint: "fp-1",
      },
    ]);

    const result = await bindDeviceRequest({
      licenseKey: "KEY-1",
      deviceName: "Till 1",
      fingerprint: "fp-1",
    });

    expect(result).toEqual({
      kind: "error",
      httpStatus: 403,
      reason: "device_license_mismatch",
      message: "Device is already active on a different license.",
    });
  });

  it("creates new pending row when fingerprint matches released device", async () => {
    mockLicenseThenFingerprint([license], [
      {
        id: "dev-released-old",
        orgId: "org-1",
        customerId: "cust-1",
        status: DEVICE_RELEASED_STATUS,
        licenseId: null,
        fingerprint: "fp-1",
      },
    ]);
    const newPending = {
      id: "dev-pending-new",
      orgId: "org-1",
      customerId: "cust-1",
      name: "Till 1",
      type: "pos",
      status: DEVICE_STATUS.PENDING_APPROVAL,
      licenseId: null,
      pendingLicenseId: "lic-1",
      fingerprint: "fp-1",
    };
    chainInsert([newPending]);

    const result = await bindDeviceRequest({
      licenseKey: "KEY-1",
      deviceName: "Till 1",
      fingerprint: "fp-1",
    });

    expect(result.kind).toBe("pending");
    if (result.kind === "pending") {
      expect(result.device.id).toBe("dev-pending-new");
      expect(result.created).toBe(true);
    }
  });

  it("does not create pending for invalid license", async () => {
    mocks.mockSelect.mockReturnValueOnce(chainSelect([]));

    const result = await bindDeviceRequest({
      licenseKey: "BAD",
      deviceName: "Till 1",
      fingerprint: "fp-1",
    });

    expect(result).toMatchObject({
      kind: "error",
      reason: "invalid_or_expired",
    });
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });
});

describe("findDevicesByFingerprintInTenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty when customerId is missing", async () => {
    const rows = await findDevicesByFingerprintInTenant({
      orgId: "org-1",
      customerId: null,
      fingerprint: "fp-1",
    });
    expect(rows).toEqual([]);
    expect(mocks.mockSelect).not.toHaveBeenCalled();
  });
});
