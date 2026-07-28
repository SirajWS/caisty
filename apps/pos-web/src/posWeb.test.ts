import { describe, expect, it } from "vitest";

import { readLocalCounts } from "./sync/localRepository.js";

describe("pos-web local repository", () => {
  it("returns zero counts when stores are empty", () => {
    localStorage.clear();
    expect(readLocalCounts()).toEqual({
      orders: 0,
      receipts: 0,
      payments: 0,
      shifts: 0,
      receiptEvents: 0,
      outboxPending: 0,
      outboxEligible: 0,
    });
  });
});
