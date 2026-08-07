import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  return { mockSelect, mockUpdate };
});

vi.mock("../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    update: mocks.mockUpdate,
  },
}));

import {
  confirmManualPosOrderPayment,
  isManualPosSettlementPayment,
} from "../manualPosPaymentSettlement.js";

function chainSelect(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
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

describe("manualPosPaymentSettlement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects manual cash/card settlement with paidAt and localOrderId", () => {
    expect(
      isManualPosSettlementPayment({
        method: "cash",
        localOrderId: "RUNTIME-1",
        paidAt: "2026-08-07T00:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      isManualPosSettlementPayment({
        method: "card",
        localOrderId: "RUNTIME-2",
        paidAt: "2026-08-07T00:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      isManualPosSettlementPayment({
        method: "online",
        localOrderId: "RUNTIME-3",
        paidAt: "2026-08-07T00:00:00.000Z",
      }),
    ).toBe(false);
    expect(
      isManualPosSettlementPayment({
        method: "cash",
        localOrderId: "",
        paidAt: "2026-08-07T00:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("marks settling device and provider-order rows on other devices paid", async () => {
    chainSelect([
      { deviceId: "device-source", platform: "fake_delivery" },
      { deviceId: "device-pos", platform: "fake_delivery" },
    ]);
    const update = chainUpdate();

    const count = await confirmManualPosOrderPayment(
      { select: mocks.mockSelect, update: mocks.mockUpdate },
      {
        orgId: "org-1",
        deviceId: "device-pos",
        localOrderId: "RUNTIME-WEBHOOK-1",
      },
    );

    expect(count).toBe(2);
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({ paymentStatus: "paid" }),
    );
  });

  it("marks only settling device for POS-native orders", async () => {
    chainSelect([{ deviceId: "device-pos", platform: "pos" }]);
    const update = chainUpdate();

    const count = await confirmManualPosOrderPayment(
      { select: mocks.mockSelect, update: mocks.mockUpdate },
      {
        orgId: "org-1",
        deviceId: "device-pos",
        localOrderId: "1001",
      },
    );

    expect(count).toBe(1);
    expect(update.set).toHaveBeenCalledTimes(1);
  });
});
