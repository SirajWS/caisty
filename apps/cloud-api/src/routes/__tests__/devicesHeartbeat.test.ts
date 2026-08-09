import Fastify from "fastify";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateDeviceHeartbeat: vi.fn(),
  dbUpdate: vi.fn(),
  dbInsert: vi.fn(),
}));

vi.mock("../../lib/posDeviceAuth.js", () => ({
  authenticateDeviceHeartbeat: (...args: unknown[]) =>
    mocks.authenticateDeviceHeartbeat(...args),
  formatPosDeviceAuthFailure: (result: {
    ok: false;
    code?: string;
    message?: string;
    error?: string;
    statusCode: number;
  }) => {
    if ("code" in result && result.code) {
      return {
        ok: false,
        code: result.code,
        message: result.message,
      };
    }
    if (result.error === "device_not_found") {
      return {
        ok: false,
        reason: "device_not_found",
        message: "Device not found.",
      };
    }
    return { ok: false, error: result.error };
  },
}));

vi.mock("../../db/client.js", () => ({
  db: {
    update: mocks.dbUpdate,
    insert: mocks.dbInsert,
  },
}));

import devicesHeartbeatRoutes from "../devicesHeartbeat.js";

const DEVICE_UUID = "11111111-1111-4111-8111-111111111111";

function mockUpdateReturning(row: Record<string, unknown> | undefined) {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(row ? [row] : []),
  };
  mocks.dbUpdate.mockReturnValue(chain);
  return chain;
}

function mockInsertValues() {
  const chain = {
    values: vi.fn().mockResolvedValue(undefined),
  };
  mocks.dbInsert.mockReturnValue(chain);
  return chain;
}

describe("POST /devices/heartbeat (devicesHeartbeat route)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function inject(body: Record<string, unknown>) {
    const app = Fastify();
    await app.register(devicesHeartbeatRoutes);
    return app.inject({
      method: "POST",
      url: "/devices/heartbeat",
      payload: body,
    });
  }

  it("returns 400 when deviceId is missing", async () => {
    const res = await inject({});
    expect(res.statusCode).toBe(400);
    expect(mocks.authenticateDeviceHeartbeat).not.toHaveBeenCalled();
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for non-UUID deviceId without touching DB", async () => {
    const res = await inject({ deviceId: "dev_legacy_fingerprint" });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toMatchObject({
      reason: "invalid_device_id",
    });
    expect(mocks.authenticateDeviceHeartbeat).not.toHaveBeenCalled();
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 403 for released device without updating timestamps", async () => {
    mocks.authenticateDeviceHeartbeat.mockResolvedValue({
      ok: false,
      code: "DEVICE_RELEASED",
      message: "Device has been released from its license.",
      statusCode: 403,
    });

    const res = await inject({ deviceId: DEVICE_UUID });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body)).toEqual({
      ok: false,
      code: "DEVICE_RELEASED",
      message: "Device has been released from its license.",
    });
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 403 for pending_approval without updating timestamps", async () => {
    mocks.authenticateDeviceHeartbeat.mockResolvedValue({
      ok: false,
      code: "DEVICE_PENDING_APPROVAL",
      message: "Device is waiting for customer portal approval.",
      statusCode: 403,
    });

    const res = await inject({ deviceId: DEVICE_UUID });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).code).toBe("DEVICE_PENDING_APPROVAL");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 403 for blocked device without updating timestamps", async () => {
    mocks.authenticateDeviceHeartbeat.mockResolvedValue({
      ok: false,
      code: "DEVICE_BLOCKED",
      message: "Device has been blocked.",
      statusCode: 403,
    });

    const res = await inject({ deviceId: DEVICE_UUID });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).code).toBe("DEVICE_BLOCKED");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 403 for rejected device without updating timestamps", async () => {
    mocks.authenticateDeviceHeartbeat.mockResolvedValue({
      ok: false,
      code: "DEVICE_REJECTED",
      message: "Device activation was rejected in the customer portal.",
      statusCode: 403,
    });

    const res = await inject({ deviceId: DEVICE_UUID });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).code).toBe("DEVICE_REJECTED");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 403 for license mismatch without updating timestamps", async () => {
    mocks.authenticateDeviceHeartbeat.mockResolvedValue({
      ok: false,
      code: "DEVICE_LICENSE_MISMATCH",
      message: "Device is not bound to the provided license.",
      statusCode: 403,
    });

    const res = await inject({ deviceId: DEVICE_UUID });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).code).toBe("DEVICE_LICENSE_MISMATCH");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 for unknown device without updating timestamps", async () => {
    mocks.authenticateDeviceHeartbeat.mockResolvedValue({
      ok: false,
      error: "device_not_found",
      statusCode: 404,
    });

    const res = await inject({ deviceId: DEVICE_UUID });

    expect(res.statusCode).toBe(404);
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("updates lastHeartbeatAt and lastSeenAt only after successful auth", async () => {
    const heartbeatAt = new Date("2026-08-04T10:00:00.000Z");
    mocks.authenticateDeviceHeartbeat.mockResolvedValue({
      ok: true,
      context: {
        orgId: "org-1",
        customerId: "cust-1",
        deviceId: DEVICE_UUID,
        licenseId: "lic-1",
      },
    });

    const updateChain = mockUpdateReturning({
      id: DEVICE_UUID,
      orgId: "org-1",
      licenseId: "lic-1",
      lastHeartbeatAt: heartbeatAt,
      lastSeenAt: heartbeatAt,
    });
    const insertChain = mockInsertValues();

    const res = await inject({ deviceId: DEVICE_UUID });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      ok: true,
      device: {
        id: DEVICE_UUID,
        lastHeartbeatAt: heartbeatAt.toISOString(),
      },
    });
    expect(mocks.authenticateDeviceHeartbeat).toHaveBeenCalledWith(DEVICE_UUID);
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        lastHeartbeatAt: expect.any(Date),
        lastSeenAt: expect.any(Date),
      }),
    );
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "heartbeat",
        licenseId: "lic-1",
      }),
    );
  });
});
