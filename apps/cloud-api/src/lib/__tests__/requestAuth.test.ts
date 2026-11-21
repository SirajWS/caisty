import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { signAdminToken, verifyAdminToken } from "../adminJwt.js";
import { signPortalToken } from "../portalJwt.js";
import { authenticateBearer } from "../requestAuth.js";

describe("authenticateBearer", () => {
  it("accepts a verified admin JWT as admin, not as portal", () => {
    const token = signAdminToken({
      adminUserId: "11111111-1111-1111-1111-111111111111",
      email: "siraj@caisty.com",
      role: "superadmin",
    });
    const user = authenticateBearer(token);
    expect(user.kind).toBe("admin");
    expect(user.isAdmin).toBe(true);
    if (user.kind === "admin") {
      expect(user.adminUserId).toBe("11111111-1111-1111-1111-111111111111");
    }
  });

  it("rejects a portal JWT as an admin token even when secrets match", () => {
    const token = signPortalToken({
      customerId: "22222222-2222-2222-2222-222222222222",
      orgId: "33333333-3333-3333-3333-333333333333",
    });
    expect(() => verifyAdminToken(token)).toThrow();
    const user = authenticateBearer(token);
    expect(user.kind).toBe("portal");
    expect(user.isAdmin).toBe(false);
  });

  it("rejects expired tokens", () => {
    const token = jwt.sign(
      {
        adminUserId: "11111111-1111-1111-1111-111111111111",
        email: "siraj@caisty.com",
        role: "superadmin",
      },
      process.env.ADMIN_JWT_SECRET || env.JWT_SECRET,
      { expiresIn: -10 },
    );
    expect(() => authenticateBearer(token)).toThrow();
  });
});
