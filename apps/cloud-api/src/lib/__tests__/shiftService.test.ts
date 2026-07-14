import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  return { mockSelect, mockInsert, mockUpdate };
});

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
    update: mocks.mockUpdate,
  },
}));

import { ShiftService } from "../shiftService.js";
import { SHIFT_STATUS } from "../shiftTypes.js";

function chainSelect(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  mocks.mockSelect.mockReturnValue(chain);
  return chain;
}

function chainInsert(error?: unknown) {
  const chain = {
    values: error
      ? vi.fn().mockRejectedValue(error)
      : vi.fn().mockResolvedValue(undefined),
  };
  mocks.mockInsert.mockReturnValue(chain);
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

const baseInput = {
  orgId: "org-1",
  customerId: "cust-1",
  deviceId: "dev-1",
  syncBatchId: "batch-1",
  localShiftId: "shift-local-1",
  cashier: "Anna",
  businessDate: "2026-07-14",
  startedAt: new Date("2026-07-14T08:00:00.000Z"),
  openingFloatMinor: 5000,
  previousClosingFloatMinor: null,
  currency: "EUR",
  schemaVersion: 1,
};

describe("ShiftService.upsertShiftSnapshot", () => {
  const service = new ShiftService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a new open shift", async () => {
    chainSelect([]);
    chainInsert();

    const result = await service.upsertShiftSnapshot({
      ...baseInput,
      status: SHIFT_STATUS.OPEN,
      endedAt: null,
    });

    expect(result).toEqual({ status: "accepted" });
    expect(mocks.mockInsert).toHaveBeenCalledOnce();
  });

  it("returns duplicate for repeated open snapshot", async () => {
    chainSelect([{ id: "shift-1", status: SHIFT_STATUS.OPEN }]);

    const result = await service.upsertShiftSnapshot({
      ...baseInput,
      status: SHIFT_STATUS.OPEN,
      endedAt: null,
    });

    expect(result).toEqual({ status: "duplicate" });
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it("closes an existing open shift", async () => {
    chainSelect([{ id: "shift-1", status: SHIFT_STATUS.OPEN }]);
    chainUpdate();

    const result = await service.upsertShiftSnapshot({
      ...baseInput,
      status: SHIFT_STATUS.CLOSED,
      endedAt: new Date("2026-07-14T16:00:00.000Z"),
      closingFloatMinor: 7200,
    });

    expect(result).toEqual({ status: "accepted" });
    expect(mocks.mockUpdate).toHaveBeenCalledOnce();
  });

  it("inserts closed snapshot when open never arrived", async () => {
    chainSelect([]);
    chainInsert();

    const result = await service.upsertShiftSnapshot({
      ...baseInput,
      status: SHIFT_STATUS.CLOSED,
      endedAt: new Date("2026-07-14T16:00:00.000Z"),
      closingFloatMinor: 7200,
    });

    expect(result).toEqual({ status: "accepted" });
  });

  it("rejects reopening a closed shift", async () => {
    chainSelect([{ id: "shift-1", status: SHIFT_STATUS.CLOSED }]);

    const result = await service.upsertShiftSnapshot({
      ...baseInput,
      status: SHIFT_STATUS.OPEN,
      endedAt: null,
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.code).toBe("shift_already_closed");
    }
  });
});
