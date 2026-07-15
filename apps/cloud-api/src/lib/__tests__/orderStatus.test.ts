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

  it("maps new and accepted explicitly", () => {
    expect(mapRawOrderStatusToPortal("new")).toBe(PORTAL_ORDER_STATUS.NEW);
    expect(mapRawOrderStatusToPortal("accepted")).toBe(PORTAL_ORDER_STATUS.ACCEPTED);
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

  it("maps canceled and rejected to cancelled", () => {
    expect(mapRawOrderStatusToPortal("canceled")).toBe(
      PORTAL_ORDER_STATUS.CANCELLED,
    );
    expect(mapRawOrderStatusToPortal("rejected")).toBe(
      PORTAL_ORDER_STATUS.CANCELLED,
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
