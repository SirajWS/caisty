import { describe, expect, it } from "vitest";

import {
  normalizePortalOrderStatus,
  mapRawOrderStatusToPortal,
  PORTAL_ORDER_STATUS,
} from "../orderStatus.js";

describe("orderStatus", () => {
  it("maps closed to completed", () => {
    expect(mapRawOrderStatusToPortal("closed")).toBe(PORTAL_ORDER_STATUS.COMPLETED);
  });

  it("maps preparing variants to in_progress", () => {
    expect(mapRawOrderStatusToPortal("preparing")).toBe(
      PORTAL_ORDER_STATUS.IN_PROGRESS,
    );
  });

  it("derives refunded from receipt status", () => {
    expect(
      normalizePortalOrderStatus({
        rawOrderStatus: "closed",
        receiptStatus: "refunded",
      }),
    ).toBe(PORTAL_ORDER_STATUS.REFUNDED);
  });

  it("maps delivered to its own portal status", () => {
    expect(mapRawOrderStatusToPortal("delivered")).toBe(
      PORTAL_ORDER_STATUS.DELIVERED,
    );
  });

  it("derives cancelled from voided receipt", () => {
    expect(
      normalizePortalOrderStatus({
        rawOrderStatus: "closed",
        receiptStatus: "voided",
      }),
    ).toBe(PORTAL_ORDER_STATUS.CANCELLED);
  });
});
