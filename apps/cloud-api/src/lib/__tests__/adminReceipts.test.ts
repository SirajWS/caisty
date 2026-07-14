import { describe, expect, it } from "vitest";

import {
  adminReceiptStatusLabel,
  adminStatusFilterToDbValues,
  mapAdminReceiptDisplayStatus,
  parseAdminReceiptStatusFilter,
} from "../adminReceiptStatus.js";

describe("adminReceiptStatus", () => {
  it("maps DB active status to completed", () => {
    expect(mapAdminReceiptDisplayStatus("active")).toBe("completed");
    expect(adminReceiptStatusLabel("completed")).toBe("Completed");
  });

  it("parses admin status filters", () => {
    expect(parseAdminReceiptStatusFilter("completed")).toBe("completed");
    expect(adminStatusFilterToDbValues("payment_changed")).toBeNull();
  });
});
