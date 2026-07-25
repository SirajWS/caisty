import { describe, expect, it } from "vitest";

import {
  formatPortalOrderStatus,
  formatPortalPaymentMethod,
  normalizePortalOrderStatusKey,
  orderStatusTone,
} from "./portalSalesLabels";
import { portalEn } from "../translations/portal/en";
import type { PortalTranslations } from "../translations/portal";

describe("portalSalesLabels", () => {
  it("maps payment methods", () => {
    expect(formatPortalPaymentMethod("cash", portalEn)).toBe("Cash");
    expect(formatPortalPaymentMethod("card", portalEn)).toBe("Card");
  });

  it("maps known statuses including completed and delivered", () => {
    expect(formatPortalOrderStatus("completed", portalEn)).toBe("Completed");
    expect(formatPortalOrderStatus("delivered", portalEn)).toBe("Delivered");
    expect(formatPortalOrderStatus("new", portalEn)).toBe("New");
    expect(formatPortalOrderStatus("accepted", portalEn)).toBe("Accepted");
    expect(formatPortalOrderStatus("ready", portalEn)).toBe("Ready");
    expect(formatPortalOrderStatus("refunded", portalEn)).toBe("Refunded");
  });

  it("maps cancelled and US spelling canceled to the cancelled label", () => {
    expect(formatPortalOrderStatus("cancelled", portalEn)).toBe("Cancelled");
    expect(formatPortalOrderStatus("canceled", portalEn)).toBe("Cancelled");
    expect(normalizePortalOrderStatusKey("canceled")).toBe("cancelled");
  });

  it("uses dash fallback for null and undefined status", () => {
    expect(formatPortalOrderStatus(undefined, portalEn)).toBe(portalEn.labels.dash);
    expect(formatPortalOrderStatus(null, portalEn)).toBe(portalEn.labels.dash);
    expect(formatPortalOrderStatus("   ", portalEn)).toBe(portalEn.labels.dash);
  });

  it("returns a neutral capitalized string for unknown statuses", () => {
    expect(formatPortalOrderStatus("shipped", portalEn)).toBe("Shipped");
    expect(orderStatusTone("shipped")).toBe("muted");
  });

  it("does not crash when orders.statusLabels is missing", () => {
    const t = {
      ...portalEn,
      orders: {
        ...portalEn.orders,
        statusLabels: undefined as unknown as typeof portalEn.orders.statusLabels,
      },
    } as PortalTranslations;

    expect(formatPortalOrderStatus("completed", t)).toBe("Completed");
    expect(formatPortalOrderStatus("delivered", t)).toBe("Delivered");
    expect(formatPortalOrderStatus("cancelled", t)).toBe("Cancelled");
    expect(formatPortalOrderStatus(undefined, t)).toBe(portalEn.labels.dash);
  });

  it("does not crash when orders or labels are missing entirely", () => {
    const t = {
      labels: undefined,
      orders: undefined,
    } as unknown as PortalTranslations;

    expect(formatPortalOrderStatus("completed", t)).toBe("Completed");
    expect(formatPortalOrderStatus(null, t)).toBe("—");
  });
});
