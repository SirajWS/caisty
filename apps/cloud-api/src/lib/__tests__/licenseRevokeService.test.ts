import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  return { mockSelect, mockUpdate, mockInsert, mockDelete };
});

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    update: mocks.mockUpdate,
    insert: mocks.mockInsert,
    delete: mocks.mockDelete,
  },
}));

import {
  LICENSE_DELETE_DISABLED,
  revokeLicense,
} from "../licenseRevokeService.js";

function chainSelect(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  mocks.mockSelect.mockReturnValue(chain);
  return chain;
}

function chainUpdate(rows: unknown[] = []) {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows),
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

const activeLicense = {
  id: "lic-1",
  orgId: "org-1",
  customerId: "cust-1",
  subscriptionId: "sub-1",
  key: "CSTY-TEST-KEY",
  plan: "starter",
  maxDevices: 1,
  status: "active",
  validFrom: new Date("2026-01-01T00:00:00Z"),
  validUntil: new Date("2027-01-01T00:00:00Z"),
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("license delete protection", () => {
  it("rejects hard delete without mutating records", () => {
    expect(LICENSE_DELETE_DISABLED.error).toBe("license_delete_disabled");
    expect(LICENSE_DELETE_DISABLED.ok).toBe(false);
  });
});

describe("revokeLicense", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revokes an active license and writes a revoked event", async () => {
    chainSelect([activeLicense]);
    const update = chainUpdate([{ ...activeLicense, status: "revoked" }]);
    const insert = chainInsert();

    const result = await revokeLicense("lic-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadyRevoked).toBe(false);
      expect(result.item.status).toBe("revoked");
      expect(result.item.id).toBe("lic-1");
      expect(result.item.customerId).toBe("cust-1");
      expect(result.item.subscriptionId).toBe("sub-1");
      expect(result.item.key).toBe("CSTY-TEST-KEY");
    }
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "revoked" }),
    );
    expect(insert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        licenseId: "lic-1",
        type: "revoked",
      }),
    );
    expect(mocks.mockDelete).not.toHaveBeenCalled();
  });

  it("is idempotent when the license is already revoked", async () => {
    chainSelect([{ ...activeLicense, status: "revoked" }]);

    const result = await revokeLicense("lic-1");

    expect(result).toEqual({
      ok: true,
      alreadyRevoked: true,
      item: { ...activeLicense, status: "revoked" },
    });
    expect(mocks.mockUpdate).not.toHaveBeenCalled();
    expect(mocks.mockInsert).not.toHaveBeenCalled();
    expect(mocks.mockDelete).not.toHaveBeenCalled();
  });

  it("does not unbind devices or change station codes", async () => {
    chainSelect([activeLicense]);
    chainUpdate([{ ...activeLicense, status: "revoked" }]);
    chainInsert();

    await revokeLicense("lic-1");

    expect(mocks.mockUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.mockDelete).not.toHaveBeenCalled();
  });
});
