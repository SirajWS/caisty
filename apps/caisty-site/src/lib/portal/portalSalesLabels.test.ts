import { describe, expect, it } from "vitest";

import {
  formatPortalOrderStatus,
  formatPortalPaymentMethod,
} from "./portalSalesLabels";
import { portalEn } from "../translations/portal/en";

describe("portalSalesLabels", () => {
  it("maps payment methods", () => {
    expect(formatPortalPaymentMethod("cash", portalEn)).toBe("Cash");
    expect(formatPortalPaymentMethod("card", portalEn)).toBe("Card");
  });

  it("maps normalized order statuses", () => {
    expect(formatPortalOrderStatus("completed", portalEn)).toBe("Completed");
    expect(formatPortalOrderStatus("refunded", portalEn)).toBe("Refunded");
    expect(formatPortalOrderStatus("new", portalEn)).toBe("New");
    expect(formatPortalOrderStatus("accepted", portalEn)).toBe("Accepted");
    expect(formatPortalOrderStatus("delivered", portalEn)).toBe("Delivered");
    expect(formatPortalOrderStatus("cancelled", portalEn)).toBe("Cancelled");
  });
});
