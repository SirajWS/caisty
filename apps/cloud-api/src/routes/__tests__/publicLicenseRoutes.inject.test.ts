import Fastify from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const ORG_B = "22222222-2222-2222-2222-222222222222";
const DEVICE_ID = "33333333-3333-3333-3333-333333333333";
const LICENSE_ID = "44444444-4444-4444-4444-444444444444";

const mocks = vi.hoisted(() => ({
  bindDeviceRequest: vi.fn(),
  findLicenseByKey: vi.fn(),
  findDeviceById: vi.fn(),
  countBoundDevicesForLicense: vi.fn(),
  authenticateDeviceHeartbeat: vi.fn(),
  authenticatePosDevice: vi.fn(),
  syncFiscalConfigurationForOrg: vi.fn(),
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
  dbInsert: vi.fn(),
}));

vi.mock("../../lib/deviceBindService.js", () => ({
  bindDeviceRequest: mocks.bindDeviceRequest,
  findLicenseByKey: mocks.findLicenseByKey,
}));

vi.mock("../../lib/deviceLifecycleService.js", () => ({
  findDeviceById: mocks.findDeviceById,
}));

vi.mock("../../lib/deviceSeats.js", () => ({
  countBoundDevicesForLicense: mocks.countBoundDevicesForLicense,
}));

vi.mock("../../lib/posDeviceAuth.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/posDeviceAuth.js")>();
  return {
    ...actual,
    authenticateDeviceHeartbeat: mocks.authenticateDeviceHeartbeat,
    authenticatePosDevice: mocks.authenticatePosDevice,
  };
});

vi.mock("../../fiscal/fiscalConfigurationService.js", () => ({
  syncFiscalConfigurationForOrg: mocks.syncFiscalConfigurationForOrg,
}));

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.dbSelect,
    update: mocks.dbUpdate,
    insert: mocks.dbInsert,
  },
}));

import { registerPublicLicenseRoutes } from "../public-license.js";
import { registerPosConfigRoutes } from "../pos-config.js";

function activeLicense(overrides: Record<string, unknown> = {}) {
  return {
    id: LICENSE_ID,
    key: "TEST-KEY",
    plan: "starter",
    status: "active",
    maxDevices: 5,
    validFrom: new Date("2020-01-01T00:00:00.000Z"),
    validUntil: new Date("2099-01-01T00:00:00.000Z"),
    orgId: ORG_A,
    customerId: "55555555-5555-5555-5555-555555555555",
    ...overrides,
  };
}

function activeDevice(overrides: Record<string, unknown> = {}) {
  return {
    id: DEVICE_ID,
    name: "Till 1",
    type: "pos",
    status: "active",
    licenseId: LICENSE_ID,
    orgId: ORG_A,
    customerId: "55555555-5555-5555-5555-555555555555",
    pendingLicenseId: null,
    lastHeartbeatAt: new Date("2026-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    fingerprint: "fp-1",
    ...overrides,
  };
}

function chainSelect(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
}

describe("public license routes (Fastify inject)", () => {
  const app = Fastify({ logger: false });

  beforeAll(async () => {
    await registerPublicLicenseRoutes(app);
    await registerPosConfigRoutes(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.countBoundDevicesForLicense.mockResolvedValue(1);
  });

  describe("POST /devices/bind", () => {
    it("returns top-level orgId on active bind success", async () => {
      mocks.bindDeviceRequest.mockResolvedValue({
        kind: "active",
        httpStatus: 200,
        device: activeDevice(),
        license: activeLicense(),
      });

      const res = await app.inject({
        method: "POST",
        url: "/devices/bind",
        payload: {
          licenseKey: "TEST-KEY",
          deviceName: "Till 1",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as { ok: boolean; orgId: string };
      expect(body.ok).toBe(true);
      expect(body.orgId).toBe(ORG_A);
    });

    it("rejects active bind when organization context is missing", async () => {
      mocks.bindDeviceRequest.mockResolvedValue({
        kind: "active",
        httpStatus: 200,
        device: activeDevice({ orgId: "" }),
        license: activeLicense(),
      });

      const res = await app.inject({
        method: "POST",
        url: "/devices/bind",
        payload: {
          licenseKey: "TEST-KEY",
          deviceName: "Till 1",
        },
      });

      expect(res.statusCode).toBe(403);
      const body = res.json() as { ok: boolean; code: string };
      expect(body.ok).toBe(false);
      expect(body.code).toBe("DEVICE_ORG_MISMATCH");
    });

    it("rejects active bind when device and license orgs disagree", async () => {
      mocks.bindDeviceRequest.mockResolvedValue({
        kind: "active",
        httpStatus: 200,
        device: activeDevice({ orgId: ORG_B }),
        license: activeLicense({ orgId: ORG_A }),
      });

      const res = await app.inject({
        method: "POST",
        url: "/devices/bind",
        payload: {
          licenseKey: "TEST-KEY",
          deviceName: "Till 1",
        },
      });

      expect(res.statusCode).toBe(403);
      const body = res.json() as { ok: boolean; code: string; orgId?: string };
      expect(body.ok).toBe(false);
      expect(body.code).toBe("DEVICE_ORG_MISMATCH");
      expect(body.orgId).toBeUndefined();
    });

    it("returns pending bind without orgId", async () => {
      mocks.bindDeviceRequest.mockResolvedValue({
        kind: "pending",
        httpStatus: 202,
        device: activeDevice({ status: "pending_approval", licenseId: null }),
        license: activeLicense(),
      });

      const res = await app.inject({
        method: "POST",
        url: "/devices/bind",
        payload: {
          licenseKey: "TEST-KEY",
          deviceName: "Till 1",
        },
      });

      expect(res.statusCode).toBe(202);
      const body = res.json() as { ok: boolean; code: string; orgId?: string };
      expect(body.ok).toBe(false);
      expect(body.code).toBe("DEVICE_PENDING_APPROVAL");
      expect(body.orgId).toBeUndefined();
    });
  });

  describe("POST /licenses/verify", () => {
    it("returns top-level orgId for active approved device", async () => {
      mocks.findLicenseByKey.mockResolvedValue(activeLicense());
      mocks.findDeviceById.mockResolvedValue(activeDevice());

      const res = await app.inject({
        method: "POST",
        url: "/licenses/verify",
        payload: { key: "TEST-KEY", deviceId: DEVICE_ID },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as { ok: boolean; orgId: string };
      expect(body.ok).toBe(true);
      expect(body.orgId).toBe(ORG_A);
    });

    it("rejects verify when device org is missing", async () => {
      mocks.findLicenseByKey.mockResolvedValue(activeLicense());
      mocks.findDeviceById.mockResolvedValue(activeDevice({ orgId: "" }));

      const res = await app.inject({
        method: "POST",
        url: "/licenses/verify",
        payload: { key: "TEST-KEY", deviceId: DEVICE_ID },
      });

      expect(res.statusCode).toBe(403);
      const body = res.json() as { ok: boolean; code: string };
      expect(body.ok).toBe(false);
      expect(body.code).toBe("DEVICE_ORG_MISMATCH");
    });

    it("rejects verify when license org is missing", async () => {
      mocks.findLicenseByKey.mockResolvedValue(activeLicense({ orgId: null }));
      mocks.findDeviceById.mockResolvedValue(activeDevice());

      const res = await app.inject({
        method: "POST",
        url: "/licenses/verify",
        payload: { key: "TEST-KEY", deviceId: DEVICE_ID },
      });

      expect(res.statusCode).toBe(403);
      const body = res.json() as { ok: boolean; code: string };
      expect(body.ok).toBe(false);
      expect(body.code).toBe("DEVICE_ORG_MISMATCH");
    });

    it("rejects verify when device and license orgs disagree", async () => {
      mocks.findLicenseByKey.mockResolvedValue(activeLicense({ orgId: ORG_A }));
      mocks.findDeviceById.mockResolvedValue(activeDevice({ orgId: ORG_B }));

      const res = await app.inject({
        method: "POST",
        url: "/licenses/verify",
        payload: { key: "TEST-KEY", deviceId: DEVICE_ID },
      });

      expect(res.statusCode).toBe(403);
      const body = res.json() as { ok: boolean; code: string };
      expect(body.ok).toBe(false);
      expect(body.code).toBe("DEVICE_ORG_MISMATCH");
    });

    it("returns pending verify without orgId", async () => {
      mocks.findLicenseByKey.mockResolvedValue(activeLicense());
      mocks.findDeviceById.mockResolvedValue(
        activeDevice({
          status: "pending_approval",
          licenseId: null,
          pendingLicenseId: LICENSE_ID,
        }),
      );

      const res = await app.inject({
        method: "POST",
        url: "/licenses/verify",
        payload: { key: "TEST-KEY", deviceId: DEVICE_ID },
      });

      expect(res.statusCode).toBe(403);
      const body = res.json() as { ok: boolean; code: string; orgId?: string };
      expect(body.ok).toBe(false);
      expect(body.code).toBe("DEVICE_PENDING_APPROVAL");
      expect(body.orgId).toBeUndefined();
    });

    it.each([
      ["released", "DEVICE_RELEASED"],
      ["blocked", "DEVICE_BLOCKED"],
      ["rejected", "DEVICE_REJECTED"],
    ] as const)("rejects verify for %s device", async (status, code) => {
      mocks.findLicenseByKey.mockResolvedValue(activeLicense());
      mocks.findDeviceById.mockResolvedValue(activeDevice({ status }));

      const res = await app.inject({
        method: "POST",
        url: "/licenses/verify",
        payload: { key: "TEST-KEY", deviceId: DEVICE_ID },
      });

      expect(res.statusCode).toBe(403);
      const body = res.json() as { ok: boolean; code: string; orgId?: string };
      expect(body.ok).toBe(false);
      expect(body.code).toBe(code);
      expect(body.orgId).toBeUndefined();
    });
  });

  describe("POST /devices/heartbeat", () => {
    it("returns top-level orgId on heartbeat success", async () => {
      mocks.authenticateDeviceHeartbeat.mockResolvedValue({
        ok: true,
        context: {
          orgId: ORG_A,
          customerId: null,
          deviceId: DEVICE_ID,
          licenseId: LICENSE_ID,
        },
      });

      mocks.dbUpdate.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: DEVICE_ID,
            orgId: ORG_A,
            licenseId: LICENSE_ID,
            lastHeartbeatAt: new Date("2026-08-01T00:00:00.000Z"),
          },
        ]),
      });

      mocks.dbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const res = await app.inject({
        method: "POST",
        url: "/devices/heartbeat",
        payload: { deviceId: DEVICE_ID },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as { ok: boolean; orgId: string };
      expect(body.ok).toBe(true);
      expect(body.orgId).toBe(ORG_A);
    });
  });

  describe("GET /pos/config", () => {
    it("returns top-level orgId on config success", async () => {
      mocks.authenticatePosDevice.mockResolvedValue({
        ok: true,
        context: {
          orgId: ORG_A,
          customerId: null,
          deviceId: DEVICE_ID,
          licenseId: LICENSE_ID,
        },
      });

      mocks.dbSelect
        .mockReturnValueOnce(chainSelect([activeLicense()]))
        .mockReturnValueOnce(
          chainSelect([
            {
              companyName: "Acme",
              legalName: "Acme GmbH",
              country: "DE",
              defaultLanguage: "de",
              businessAddressJson: {},
              vatId: "",
              taxId: "",
              configVersion: 1,
              updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            },
          ]),
        )
        .mockReturnValueOnce(chainSelect([{ name: "Acme Org" }]));

      mocks.findDeviceById.mockResolvedValue(activeDevice());
      mocks.syncFiscalConfigurationForOrg.mockResolvedValue({
        currency: "EUR",
        fiscalRequired: false,
        provider: "none",
        receiptMode: "standard",
        fiscalStatusCustomer: "ready",
        fiscalProfileKey: "DE",
      });

      const res = await app.inject({
        method: "GET",
        url: `/pos/config?deviceId=${DEVICE_ID}&licenseKey=TEST-KEY`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as { ok: boolean; orgId: string };
      expect(body.ok).toBe(true);
      expect(body.orgId).toBe(ORG_A);
    });
  });
});
