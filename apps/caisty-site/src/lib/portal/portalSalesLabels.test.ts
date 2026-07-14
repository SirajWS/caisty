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
  });
});
