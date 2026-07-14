import { describe, expect, it } from "vitest";

import { buildPortalOrderTimeline } from "../portalOrderTimeline.js";
import { PORTAL_ORDER_STATUS } from "../orderStatus.js";

describe("buildPortalOrderTimeline", () => {
  it("includes created and paid when receipt exists", () => {
    const timeline = buildPortalOrderTimeline({
      orderId: "ord-1",
      soldAt: "2026-07-14T12:00:00.000Z",
      rawOrderStatus: "closed",
      normalizedStatus: PORTAL_ORDER_STATUS.COMPLETED,
      hasPayment: true,
      hasReceipt: true,
      paidAt: "2026-07-14T12:05:00.000Z",
      cashier: "Anna",
    });

    expect(timeline.map((entry) => entry.kind)).toEqual([
      "created",
      "paid",
      "completed",
    ]);
  });

  it("does not add preparing without raw status evidence", () => {
    const timeline = buildPortalOrderTimeline({
      orderId: "ord-2",
      soldAt: "2026-07-14T12:00:00.000Z",
      rawOrderStatus: "closed",
      normalizedStatus: PORTAL_ORDER_STATUS.COMPLETED,
      hasPayment: false,
      hasReceipt: false,
    });

    expect(timeline.some((entry) => entry.kind === "preparing")).toBe(false);
  });

  it("sorts chronologically", () => {
    const timeline = buildPortalOrderTimeline({
      orderId: "ord-3",
      soldAt: "2026-07-14T12:00:00.000Z",
      rawOrderStatus: "ready",
      normalizedStatus: PORTAL_ORDER_STATUS.READY,
      hasPayment: true,
      hasReceipt: true,
      paidAt: "2026-07-14T12:10:00.000Z",
    });

    const times = timeline.map((entry) => new Date(entry.occurredAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
