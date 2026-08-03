import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  const mockTransaction = vi.fn();
  const mockGetLicenseSeatSummary = vi.fn();
  return {
    mockSelect,
    mockUpdate,
    mockInsert,
    mockTransaction,
    mockGetLicenseSeatSummary,
  };
});

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    update: mocks.mockUpdate,
    insert: mocks.mockInsert,
    transaction: mocks.mockTransaction,
  },
}));

vi.mock("../deviceSeats.js", () => ({
  getLicenseSeatSummary: (...args: unknown[]) =>
    mocks.mockGetLicenseSeatSummary(...args),
}));

import { DEVICE_STATUS } from "../deviceAccessPolicy.js";
import {
  allowedActionsForStatus,
  approvePortalDevice,
  blockPortalDevice,
  computeSeatSummaryFromDevices,
  getPortalDeviceManagement,
  maskFingerprint,
  rejectPortalDevice,
  releasePortalDevice,
  unblockPortalDevice,
} from "../portalDeviceService.js";

const actor = { customerId: "cust-1", orgId: "org-1" };

function chainSelect(rows: unknown[], opts?: { forUpdate?: boolean }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  if (opts?.forUpdate) {
    chain.for = vi.fn().mockReturnThis();
  }
  mocks.mockSelect.mockReturnValue(chain);
  return chain;
}

function chainUpdate(returning: unknown[] = []) {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returning),
  };
  mocks.mockUpdate.mockReturnValue(chain);
  return chain;
}

function chainInsert() {
  const chain = { values: vi.fn().mockResolvedValue(undefined) };
  mocks.mockInsert.mockReturnValue(chain);
  return chain;
}

const pendingDevice = {
  id: "dev-pending",
  orgId: "org-1",
  customerId: "cust-1",
  name: "Till Pending",
  type: "pos",
  status: DEVICE_STATUS.PENDING_APPROVAL,
  licenseId: null,
  pendingLicenseId: "lic-1",
  fingerprint: "fp-abcdefghijklmnop",
  approvedAt: null,
  blockedAt: null,
  rejectedAt: null,
  releasedAt: null,
  createdAt: new Date("2026-08-01T10:00:00Z"),
  lastSeenAt: null,
  lastHeartbeatAt: null,
  appVersion: "1.0",
};

const activeDevice = {
  ...pendingDevice,
  id: "dev-active",
  status: DEVICE_STATUS.ACTIVE,
  licenseId: "lic-1",
  pendingLicenseId: null,
  approvedAt: new Date("2026-08-01T11:00:00Z"),
};

const licenseRow = {
  id: "lic-1",
  orgId: "org-1",
  customerId: "cust-1",
  key: "CSTY-SECRET-KEY",
  plan: "pro",
  maxDevices: 3,
  status: "active",
  validFrom: new Date("2026-01-01T00:00:00Z"),
  validUntil: new Date("2027-01-01T00:00:00Z"),
};

describe("portalDeviceService helpers", () => {
  it("masks fingerprints for portal display", () => {
    expect(maskFingerprint("abcdefghijklmnop")).toBe("abcd…mnop");
    expect(maskFingerprint("short")).toBe("****");
    expect(maskFingerprint(null)).toBeNull();
  });

  it("derives allowed actions per lifecycle status", () => {
    expect(allowedActionsForStatus(DEVICE_STATUS.PENDING_APPROVAL)).toEqual([
      "approve",
      "reject",
    ]);
    expect(allowedActionsForStatus(DEVICE_STATUS.ACTIVE)).toEqual([
      "block",
      "release",
    ]);
    expect(allowedActionsForStatus(DEVICE_STATUS.BLOCKED)).toEqual([
      "unblock",
      "release",
    ]);
    expect(allowedActionsForStatus(DEVICE_STATUS.RELEASED)).toEqual([]);
  });

  it("computes seat summary with blocked counting and pending excluded", () => {
    const summary = computeSeatSummaryFromDevices(
      [
        { status: "active", licenseId: "lic-1" },
        { status: "blocked", licenseId: "lic-1" },
        { status: "pending_approval", licenseId: null },
        { status: "rejected", licenseId: null },
        { status: "released", licenseId: null },
      ] as any[],
      3,
    );
    expect(summary.usedSeats).toBe(2);
    expect(summary.remainingSeats).toBe(1);
    expect(summary.overLimit).toBe(false);
  });

  it("flags over-limit legacy customers without auto-remediation", () => {
    const summary = computeSeatSummaryFromDevices(
      [
        { status: "active", licenseId: "lic-1" },
        { status: "active", licenseId: "lic-1" },
        { status: "blocked", licenseId: "lic-1" },
      ] as any[],
      1,
    );
    expect(summary.usedSeats).toBe(3);
    expect(summary.remainingSeats).toBe(0);
    expect(summary.overLimit).toBe(true);
  });
});

describe("getPortalDeviceManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetLicenseSeatSummary.mockResolvedValue({
      used: 1,
      limit: 3,
      unlimitedDevices: false,
    });
  });

  it("returns seat summary and devices without license keys", async () => {
    mocks.mockSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([pendingDevice, activeDevice]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([licenseRow]),
      });

    const result = await getPortalDeviceManagement(actor);
    expect(result.ok).toBe(true);
    expect(result.summary.plan).toBe("pro");
    expect(result.summary.usedSeats).toBe(1);
    expect(result.summary.pendingCount).toBe(1);
    expect(result.summary.activeCount).toBe(1);
    expect(result.devices).toHaveLength(2);
    const pending = result.devices.find(
      (d) => d.lifecycleStatus === DEVICE_STATUS.PENDING_APPROVAL,
    );
    expect(pending?.fingerprintMasked).toBe("fp-a…mnop");
    expect(JSON.stringify(result)).not.toContain("CSTY-SECRET-KEY");
  });
});

describe("approvePortalDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetLicenseSeatSummary.mockResolvedValue({
      used: 1,
      limit: 3,
      unlimitedDevices: false,
    });
  });

  it("returns not found for foreign devices without leaking tenant info", async () => {
    mocks.mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          for: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([
            { ...pendingDevice, customerId: "other" },
          ]),
        }),
      };
      return fn(tx);
    });

    const result = await approvePortalDevice("dev-pending", actor);
    expect(result).toEqual({
      ok: false,
      code: "DEVICE_NOT_FOUND",
      message: "Device not found.",
    });
  });

  it("activates pending device when a seat is available", async () => {
    mocks.mockTransaction.mockImplementation(async (fn) => {
      const txSelectDevice = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        for: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([pendingDevice]),
      };
      const txSelectLicense = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        for: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([licenseRow]),
      };
      const txSelectCount = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ value: 1 }]),
      };
      const tx = {
        select: vi
          .fn()
          .mockReturnValueOnce(txSelectDevice)
          .mockReturnValueOnce(txSelectLicense)
          .mockReturnValueOnce(txSelectCount),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([
            {
              ...pendingDevice,
              status: DEVICE_STATUS.ACTIVE,
              licenseId: "lic-1",
              pendingLicenseId: null,
            },
          ]),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      return fn(tx);
    });

    const result = await approvePortalDevice("dev-pending", actor);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe("active");
      expect(result.licenseId).toBe("lic-1");
      expect(result.idempotent).toBe(false);
      expect(result.seatSummary.used).toBe(2);
    }
  });

  it("rejects approval when seat limit is reached", async () => {
    mocks.mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        select: vi
          .fn()
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            for: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([pendingDevice]),
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            for: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ ...licenseRow, maxDevices: 1 }]),
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([{ value: 1 }]),
          }),
        update: vi.fn(),
        insert: vi.fn(),
      };
      return fn(tx);
    });

    const result = await approvePortalDevice("dev-pending", actor);
    expect(result).toEqual({
      ok: false,
      code: "DEVICE_LIMIT_REACHED",
      message: "Device seat limit reached for this license.",
      maxDevices: 1,
      usedSeats: 1,
      remainingSeats: 0,
    });
  });

  it("is idempotent when device is already active", async () => {
    mocks.mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        select: vi
          .fn()
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            for: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([activeDevice]),
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([{ value: 1 }]),
          }),
        update: vi.fn(),
        insert: vi.fn(),
      };
      return fn(tx);
    });

    const result = await approvePortalDevice("dev-active", actor);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.idempotent).toBe(true);
    }
  });

  it("rejects approve from released status", async () => {
    mocks.mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          for: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([
            { ...pendingDevice, status: "released" },
          ]),
        }),
      };
      return fn(tx);
    });

    const result = await approvePortalDevice("dev-pending", actor);
    expect(result).toMatchObject({
      ok: false,
      code: "DEVICE_INVALID_TRANSITION",
    });
  });
});

describe("rejectPortalDevice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects pending device and clears pending license", async () => {
    chainSelect([pendingDevice]);
    chainUpdate([
      {
        ...pendingDevice,
        status: DEVICE_STATUS.REJECTED,
        pendingLicenseId: null,
      },
    ]);
    chainInsert();

    const result = await rejectPortalDevice("dev-pending", actor);
    expect(result).toEqual({
      ok: true,
      deviceId: "dev-pending",
      status: DEVICE_STATUS.REJECTED,
    });
  });

  it("returns not found for foreign device", async () => {
    chainSelect([{ ...pendingDevice, customerId: "other" }]);
    const result = await rejectPortalDevice("dev-pending", actor);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("DEVICE_NOT_FOUND");
    }
  });
});

describe("block and unblock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks active device while keeping license_id", async () => {
    mocks.mockSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([activeDevice]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([licenseRow]),
      });
    chainUpdate([{ ...activeDevice, status: DEVICE_STATUS.BLOCKED }]);
    chainInsert();

    const result = await blockPortalDevice("dev-active", actor);
    expect(result).toEqual({
      ok: true,
      deviceId: "dev-active",
      status: DEVICE_STATUS.BLOCKED,
    });
  });

  it("unblocks blocked device without consuming a new seat", async () => {
    const blocked = {
      ...activeDevice,
      status: DEVICE_STATUS.BLOCKED,
      blockedAt: new Date(),
    };
    mocks.mockSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([blocked]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([licenseRow]),
      });
    chainUpdate([{ ...blocked, status: DEVICE_STATUS.ACTIVE, blockedAt: null }]);
    chainInsert();

    const result = await unblockPortalDevice("dev-active", actor);
    expect(result).toEqual({
      ok: true,
      deviceId: "dev-active",
      status: DEVICE_STATUS.ACTIVE,
    });
  });
});

describe("releasePortalDevice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delegates to releaseDevice for tenant-owned device", async () => {
    mocks.mockSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([activeDevice]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([activeDevice]),
      });
    chainUpdate();
    chainInsert();
    mocks.mockGetLicenseSeatSummary.mockResolvedValue({ used: 0, limit: 3 });

    const result = await releasePortalDevice("dev-active", actor);
    expect(result.ok).toBe(true);
  });

  it("returns not found for foreign device", async () => {
    chainSelect([{ ...activeDevice, customerId: "other" }]);
    const result = await releasePortalDevice("dev-active", actor);
    expect(result).toEqual({
      ok: false,
      code: "not_found",
      message: "Device not found.",
    });
  });
});

describe("plan seat limits (pure policy)", () => {
  it("starter allows one seat only", () => {
    const summary = computeSeatSummaryFromDevices(
      [{ status: "active", licenseId: "lic-1" }] as any[],
      1,
    );
    expect(summary.remainingSeats).toBe(0);
  });

  it("pro allows three seats with blocked consuming", () => {
    const summary = computeSeatSummaryFromDevices(
      [
        { status: "active", licenseId: "lic-1" },
        { status: "blocked", licenseId: "lic-1" },
        { status: "active", licenseId: "lic-1" },
      ] as any[],
      3,
    );
    expect(summary.usedSeats).toBe(3);
    expect(summary.remainingSeats).toBe(0);
  });

  it("business allows five seats", () => {
    const devices = Array.from({ length: 5 }, (_, i) => ({
      status: "active",
      licenseId: "lic-1",
      id: `d${i}`,
    }));
    const summary = computeSeatSummaryFromDevices(devices as any[], 5);
    expect(summary.remainingSeats).toBe(0);
    expect(summary.overLimit).toBe(false);
  });
});

describe("parallel approval race (transaction logic)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows only one approval when two pending compete for the last seat", async () => {
    let seatCount = 2;
    const proLicense = { ...licenseRow, maxDevices: 3 };

    mocks.mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        select: vi
          .fn()
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            for: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([pendingDevice]),
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            for: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([proLicense]),
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([{ value: seatCount }]),
          }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([
            {
              ...pendingDevice,
              status: DEVICE_STATUS.ACTIVE,
              licenseId: "lic-1",
            },
          ]),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      return fn(tx);
    });

    const first = await approvePortalDevice("dev-pending", actor);
    expect(first.ok).toBe(true);

    seatCount = 3;
    const second = await approvePortalDevice("dev-pending-2", actor);
    expect(second).toMatchObject({
      ok: false,
      code: "DEVICE_LIMIT_REACHED",
      usedSeats: 3,
      remainingSeats: 0,
    });
  });
});

describe("invalid transition matrix", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects block from pending", async () => {
    chainSelect([pendingDevice]);
    const result = await blockPortalDevice("dev-pending", actor);
    expect(result).toMatchObject({
      ok: false,
      code: "DEVICE_INVALID_TRANSITION",
    });
  });

  it("rejects unblock from active", async () => {
    chainSelect([activeDevice]);
    const result = await unblockPortalDevice("dev-active", actor);
    expect(result).toMatchObject({
      ok: false,
      code: "DEVICE_INVALID_TRANSITION",
    });
  });

  it("rejects reject from active", async () => {
    chainSelect([activeDevice]);
    const result = await rejectPortalDevice("dev-active", actor);
    expect(result).toMatchObject({
      ok: false,
      code: "DEVICE_INVALID_TRANSITION",
    });
  });
});

  it("defines tenant-scoped partial unique index without global fingerprint lock", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const sql = await fs.readFile(
      path.join(
        process.cwd(),
        "drizzle/031_pending_fingerprint_tenant_unique.sql",
      ),
      "utf8",
    );
    expect(sql).toContain("idx_devices_pending_fingerprint_tenant");
    expect(sql).toContain("customer_id, org_id, fingerprint, pending_license_id");
    expect(sql).toContain("status = 'pending_approval'");
    expect(sql).toContain("fingerprint IS NOT NULL");
  });
});
