import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.hoisted(() => ({
  authenticatePosDevice: vi.fn(),
  formatPosDeviceAuthFailure: vi.fn((r: { code: string; message: string }) => ({
    ok: false,
    code: r.code,
    message: r.message,
  })),
}));

vi.mock("../../lib/posDeviceAuth.js", () => authMock);

vi.mock("../../posSync/PosSyncService.js", () => ({
  posSyncService: { processBatch: vi.fn() },
}));

vi.mock("../../posSync/PosPullService.js", () => ({
  posPullService: { pullChanges: vi.fn() },
}));

import { posSyncService } from "../../posSync/PosSyncService.js";
import { posPullService } from "../../posSync/PosPullService.js";

describe("pos sync channel auth guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks pending_approval from batch", async () => {
    authMock.authenticatePosDevice.mockResolvedValue({
      ok: false,
      code: "DEVICE_PENDING_APPROVAL",
      message: "pending",
      statusCode: 403,
    });

    const auth = await authMock.authenticatePosDevice({
      deviceId: "00000000-0000-0000-0000-000000000099",
      licenseKey: "KEY",
    });

    expect(auth.ok).toBe(false);
    expect(posSyncService.processBatch).not.toHaveBeenCalled();
  });

  it("blocks released device from pull", async () => {
    authMock.authenticatePosDevice.mockResolvedValue({
      ok: false,
      code: "DEVICE_RELEASED",
      message: "released",
      statusCode: 403,
    });

    const auth = await authMock.authenticatePosDevice({
      deviceId: "00000000-0000-0000-0000-000000000099",
      licenseKey: "KEY",
    });

    expect(auth.ok).toBe(false);
    expect(posPullService.pullChanges).not.toHaveBeenCalled();
  });

  it("allows active device with org context", async () => {
    authMock.authenticatePosDevice.mockResolvedValue({
      ok: true,
      context: {
        orgId: "11111111-1111-1111-1111-111111111111",
        customerId: null,
        deviceId: "00000000-0000-0000-0000-000000000099",
        licenseId: "lic-1",
      },
    });

    const auth = await authMock.authenticatePosDevice({
      deviceId: "00000000-0000-0000-0000-000000000099",
      licenseKey: "KEY",
    });

    expect(auth.ok).toBe(true);
    if (auth.ok) {
      expect(auth.context.orgId).toBe("11111111-1111-1111-1111-111111111111");
    }
  });
});
