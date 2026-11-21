import { describe, expect, it } from "vitest";

import {
  assertNoCustomerSecrets,
  toPublicCustomer,
} from "../publicCustomer.js";

describe("toPublicCustomer", () => {
  it("omits passwordHash from customer JSON", () => {
    const publicCustomer = toPublicCustomer({
      id: "c1",
      orgId: "o1",
      name: "Cafe",
      email: "cafe@example.com",
      status: "active",
      portalStatus: "active",
      profile: { country: "DE" },
      stripeCustomerId: "cus_test",
      emailVerifiedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      passwordHash: "SHOULD_NOT_APPEAR",
      password_hash: "SHOULD_NOT_APPEAR_EITHER",
    });

    expect(publicCustomer).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(publicCustomer)).not.toContain("SHOULD_NOT_APPEAR");
    expect(publicCustomer.email).toBe("cafe@example.com");
    expect(() => assertNoCustomerSecrets({ items: [publicCustomer] })).not.toThrow();
  });
});
