import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  const mockGetLicenseSeatSummary = vi.fn();
  return { mockSelect, mockUpdate, mockInsert, mockGetLicenseSeatSummary };
});

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    update: mocks.mockUpdate,
    insert: mocks.mockInsert,
  },
}));

vi.mock("../deviceSeats.js", () => ({
  getLicenseSeatSummary: (...args: unknown[]) =>
    mocks.mockGetLicenseSeatSummary(...args),
}));

import { releaseDevice, DEVICE_RELEASED_STATUS } from "../deviceLifecycleService.js";
import { DEVICE_STATUS } from "../deviceAccessPolicy.js";

function chainSelect(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  mocks.mockSelect.mockReturnValue(chain);
  return chain;
}

function chainUpdate() {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  mocks.mockUpdate.mockReturnValue(chain);
  return chain;
}

function chainInsert() {
  const chain = {
    values: vi.fn().mockResolvedValue(undefined),
  };
  mocks.mockInsert.mockReturnValue(chain);
  return chain;
}

describe("releaseDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetLicenseSeatSummary.mockResolvedValue({ used: 1, limit: 3 });
  });

  const activeDevice = {
    id: "dev-1",
    orgId: "org-1",
    customerId: "cust-1",
    name: "Till 1",
    type: "pos",
    status: "active",
    licenseId: "lic-1",
    fingerprint: null,
    releasedAt: null,
  };

  it("soft-releases a bound device and frees the seat", async () => {
    chainSelect([activeDevice]);
    chainUpdate();
    chainInsert();

    const result = await releaseDevice("dev-1", {
      type: "portal_customer",
      customerId: "cust-1",
      orgId: "org-1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.deviceId).toBe("dev-1");
      expect(result.licenseId).toBe("lic-1");
      expect(result.licenseDevices).toEqual({ used: 1, limit: 3 });
    }

    expect(mocks.mockUpdate).toHaveBeenCalled();
    expect(mocks.mockInsert).toHaveBeenCalled();
    expect(mocks.mockGetLicenseSeatSummary).toHaveBeenCalledWith("lic-1");
  });

  it("rejects portal release when customer does not own the device", async () => {
    chainSelect([activeDevice]);

    const result = await releaseDevice("dev-1", {
      type: "portal_customer",
      customerId: "other",
      orgId: "org-1",
    });

    expect(result).toEqual({
      ok: false,
      code: "forbidden",
      message: "You do not have permission to release this device.",
    });
  });

  it("rejects already released devices", async () => {
    chainSelect([
      {
        ...activeDevice,
        status: DEVICE_RELEASED_STATUS,
        licenseId: null,
        releasedAt: new Date("2026-07-01T00:00:00Z"),
      },
    ]);

    const result = await releaseDevice("dev-1", {
      type: "admin",
      adminUserId: "admin-1",
    });

    expect(result).toEqual({
      ok: false,
      code: "already_released",
      message: "Device is already released.",
    });
  });

  it("rejects devices that are not bound to a license", async () => {
    chainSelect([
      {
        ...activeDevice,
        licenseId: null,
      },
    ]);

    const result = await releaseDevice("dev-1", {
      type: "admin",
      adminUserId: "admin-1",
    });

    expect(result).toEqual({
      ok: false,
      code: "not_bound",
      message: "Device is not bound to a license.",
    });
  });

  it("rejects release from pending_approval status", async () => {
    chainSelect([
      {
        ...activeDevice,
        status: "pending_approval",
        licenseId: null,
        pendingLicenseId: "lic-1",
      },
    ]);

    const result = await releaseDevice("dev-1", {
      type: "admin",
      adminUserId: "admin-1",
    });

    expect(result).toEqual({
      ok: false,
      code: "invalid_transition",
      message: 'Device cannot be released from status "pending_approval".',
    });
  });

  it("releases blocked devices and clears blocked_at", async () => {
    chainSelect([
      {
        ...activeDevice,
        status: "blocked",
        blockedAt: new Date("2026-08-01T12:00:00Z"),
      },
    ]);
    const updateChain = chainUpdate();
    chainInsert();

    const result = await releaseDevice("dev-1", {
      type: "portal_customer",
      customerId: "cust-1",
      orgId: "org-1",
    });

    expect(result.ok).toBe(true);
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: DEVICE_RELEASED_STATUS,
        blockedAt: null,
        pendingLicenseId: null,
      }),
    );
  });
});
