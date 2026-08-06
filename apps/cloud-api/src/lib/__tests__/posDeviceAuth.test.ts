import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  return { mockSelect, findDeviceById: vi.fn() };
});

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
  },
}));

vi.mock("../deviceLifecycleService.js", () => ({
  findDeviceById: (...args: unknown[]) => mocks.findDeviceById(...args),
  DEVICE_RELEASED_STATUS: "released",
}));

import {
  authenticateDeviceHeartbeat,
  authenticatePosDevice,
  formatPosDeviceAuthFailure,
} from "../posDeviceAuth.js";
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

const activeDevice = {
  id: "dev-1",
  orgId: "org-1",
  customerId: "cust-1",
  status: DEVICE_STATUS.ACTIVE,
  licenseId: "lic-1",
  name: "Till",
  type: "pos",
  fingerprint: null,
};

const license = {
  id: "lic-1",
  orgId: "org-1",
  customerId: "cust-1",
  key: "KEY-1",
  status: "active",
  plan: "starter",
  maxDevices: 1,
  validFrom: new Date("2020-01-01"),
  validUntil: new Date("2099-01-01"),
  createdAt: new Date(),
  updatedAt: new Date(),
  subscriptionId: null,
};

describe("authenticatePosDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows active device with matching license and org", async () => {
    mocks.findDeviceById.mockResolvedValue(activeDevice);
    chainSelect([license]);

    const result = await authenticatePosDevice({
      deviceId: "dev-1",
      licenseKey: "KEY-1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.context.deviceId).toBe("dev-1");
    }
  });

  it("denies pending_approval", async () => {
    mocks.findDeviceById.mockResolvedValue({
      ...activeDevice,
      status: DEVICE_STATUS.PENDING_APPROVAL,
      licenseId: null,
      pendingLicenseId: "lic-1",
    });
    chainSelect([license]);

    const result = await authenticatePosDevice({
      deviceId: "dev-1",
      licenseKey: "KEY-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok && "code" in result) {
      expect(result.code).toBe("DEVICE_PENDING_APPROVAL");
    }
  });

  it("denies released device", async () => {
    mocks.findDeviceById.mockResolvedValue({
      ...activeDevice,
      status: "released",
      licenseId: null,
    });
    chainSelect([license]);

    const result = await authenticatePosDevice({
      deviceId: "dev-1",
      licenseKey: "KEY-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok && "code" in result) {
      expect(result.code).toBe("DEVICE_RELEASED");
    }
  });

  it("denies license mismatch", async () => {
    mocks.findDeviceById.mockResolvedValue({
      ...activeDevice,
      licenseId: "lic-other",
    });
    chainSelect([license]);

    const result = await authenticatePosDevice({
      deviceId: "dev-1",
      licenseKey: "KEY-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok && "code" in result) {
      expect(result.code).toBe("DEVICE_LICENSE_MISMATCH");
    }
  });

  it("denies org mismatch", async () => {
    mocks.findDeviceById.mockResolvedValue({
      ...activeDevice,
      orgId: "org-other",
    });
    chainSelect([license]);

    const result = await authenticatePosDevice({
      deviceId: "dev-1",
      licenseKey: "KEY-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok && "code" in result) {
      expect(result.code).toBe("DEVICE_ORG_MISMATCH");
    }
  });
});

describe("missing org context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns DEVICE_ORG_MISMATCH when device org is empty", async () => {
    mocks.findDeviceById.mockResolvedValue({
      ...activeDevice,
      orgId: "",
    });
    chainSelect([license]);

    const result = await authenticatePosDevice({
      deviceId: "dev-1",
      licenseKey: "KEY-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok && "code" in result) {
      expect(result.code).toBe("DEVICE_ORG_MISMATCH");
    }
  });
});

describe("authenticateDeviceHeartbeat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies pending without upgrading status", async () => {
    mocks.findDeviceById.mockResolvedValue({
      ...activeDevice,
      status: DEVICE_STATUS.PENDING_APPROVAL,
      licenseId: null,
    });

    const result = await authenticateDeviceHeartbeat("dev-1");

    expect(result.ok).toBe(false);
    if (!result.ok && "code" in result) {
      expect(result.code).toBe("DEVICE_PENDING_APPROVAL");
    }
  });

  it("allows active device via bound license", async () => {
    mocks.findDeviceById.mockResolvedValue(activeDevice);
    chainSelect([license]);

    const result = await authenticateDeviceHeartbeat("dev-1");

    expect(result.ok).toBe(true);
  });
});

describe("formatPosDeviceAuthFailure", () => {
  it("maps policy denial to stable code payload", () => {
    expect(
      formatPosDeviceAuthFailure({
        ok: false,
        code: "DEVICE_BLOCKED",
        message: "Device has been blocked.",
        statusCode: 403,
      }),
    ).toEqual({
      ok: false,
      code: "DEVICE_BLOCKED",
      message: "Device has been blocked.",
    });
  });
});

describe("policy codes for blocked rejected invalid", () => {
  const cases = [
    ["blocked", "DEVICE_BLOCKED"],
    ["rejected", "DEVICE_REJECTED"],
    ["weird", "DEVICE_INVALID_STATUS"],
  ] as const;

  for (const [status, code] of cases) {
    it(`maps ${status} to ${code}`, async () => {
      mocks.findDeviceById.mockResolvedValue({
        ...activeDevice,
        status,
        licenseId: status === "blocked" ? "lic-1" : null,
      });
      chainSelect([license]);

      const result = await authenticatePosDevice({
        deviceId: "dev-1",
        licenseKey: "KEY-1",
      });

      expect(result.ok).toBe(false);
      if (!result.ok && "code" in result) {
        expect(result.code).toBe(code);
      }
    });
  }
});

describe("active without licenseId", () => {
  it("returns DEVICE_NOT_BOUND", async () => {
    mocks.findDeviceById.mockResolvedValue({
      ...activeDevice,
      licenseId: null,
    });
    chainSelect([license]);

    const result = await authenticatePosDevice({
      deviceId: "dev-1",
      licenseKey: "KEY-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok && "code" in result) {
      expect(result.code).toBe("DEVICE_NOT_BOUND");
    }
  });
});
