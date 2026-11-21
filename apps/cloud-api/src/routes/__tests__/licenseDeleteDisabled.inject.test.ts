import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadActiveAdminUser: vi.fn(),
}));

vi.mock("../../lib/adminUsersLookup.js", () => ({
  loadActiveAdminUser: mocks.loadActiveAdminUser,
}));

import { signAdminToken } from "../../lib/adminJwt.js";
import { registerCloudApiAuthHook } from "../../lib/registerCloudApiAuthHook.js";
import { registerLicensesRoutes } from "../licenses.js";

const SUPERADMIN_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

async function buildApp() {
  const app = Fastify({ logger: false });
  await registerCloudApiAuthHook(app);
  await registerLicensesRoutes(app);
  await app.ready();
  return app;
}

describe("DELETE /licenses/:id", () => {
  beforeEach(() => {
    mocks.loadActiveAdminUser.mockResolvedValue({
      id: SUPERADMIN_ID,
      email: "siraj@caisty.com",
      name: "Siraj",
      passwordHash: "x",
      role: "superadmin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 license_delete_disabled for superadmin without deleting", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "DELETE",
      url: "/licenses/lic-1",
      headers: {
        authorization: `Bearer ${signAdminToken({
          adminUserId: SUPERADMIN_ID,
          email: "siraj@caisty.com",
          role: "superadmin",
        })}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe("license_delete_disabled");
    await app.close();
  });
});
