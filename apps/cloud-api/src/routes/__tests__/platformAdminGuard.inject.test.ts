import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadActiveAdminUser: vi.fn(),
}));

vi.mock("../../lib/adminUsersLookup.js", () => ({
  loadActiveAdminUser: mocks.loadActiveAdminUser,
}));

import { signAdminToken } from "../../lib/adminJwt.js";
import { signPortalToken } from "../../lib/portalJwt.js";
import { toPublicCustomer } from "../../lib/publicCustomer.js";
import { registerCloudApiAuthHook } from "../../lib/registerCloudApiAuthHook.js";
import { registerCustomersRoutes } from "../customers.js";

const SUPERADMIN_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const SUPPORT_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const CUSTOMER_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const ORG_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const INVOICE_OWN = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
const INVOICE_OTHER = "ffffffff-ffff-ffff-ffff-ffffffffffff";

function superadminToken() {
  return signAdminToken({
    adminUserId: SUPERADMIN_ID,
    email: "siraj@caisty.com",
    role: "superadmin",
  });
}

function supportToken() {
  return signAdminToken({
    adminUserId: SUPPORT_ID,
    email: "support@caisty.com",
    role: "support",
  });
}

function portalToken() {
  return signPortalToken({
    customerId: CUSTOMER_ID,
    orgId: ORG_ID,
  });
}

async function buildApp() {
  const app = Fastify({ logger: false });
  await registerCloudApiAuthHook(app);
  await registerCustomersRoutes(app);

  app.get("/devices", async () => ({ items: [], total: 0 }));
  app.post("/admin/devices/:deviceId/archive", async () => ({
    ok: true,
    archived: true,
  }));
  app.post("/admin/devices/:deviceId/unarchive", async () => ({
    ok: true,
    restored: true,
  }));
  app.get("/licenses", async () => ({ items: [], total: 0 }));
  app.get("/portal/login-check", async () => ({ ok: true, portal: true }));
  app.get("/portal/receipts", async () => ({ items: [], b7: true }));
  app.get("/pos/sync/batch-check", async () => ({ ok: true }));

  app.get<{ Params: { id: string } }>("/invoices/:id/html", async (_req, reply) => {
    reply.type("text/html").send("<html>admin-invoice</html>");
  });

  app.get<{ Params: { id: string } }>(
    "/portal/invoices/:id/html",
    async (request, reply) => {
      const auth = request.headers.authorization ?? "";
      const token = auth.slice("Bearer ".length);
      const { verifyPortalToken } = await import("../../lib/portalJwt.js");
      let payload: { customerId: string };
      try {
        payload = verifyPortalToken(token);
      } catch {
        reply.code(401).type("text/plain").send("Unauthorized");
        return;
      }
      if (request.params.id === INVOICE_OWN && payload.customerId === CUSTOMER_ID) {
        reply.type("text/html").send("<html>own-invoice</html>");
        return;
      }
      reply.code(403).type("text/plain").send("Forbidden");
    },
  );

  await app.ready();
  return app;
}

describe("platform admin API guard", () => {
  beforeEach(() => {
    mocks.loadActiveAdminUser.mockImplementation(async (id: string) => {
      if (id === SUPERADMIN_ID) {
        return {
          id: SUPERADMIN_ID,
          email: "siraj@caisty.com",
          name: "Siraj",
          passwordHash: "x",
          role: "superadmin",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      if (id === SUPPORT_ID) {
        return {
          id: SUPPORT_ID,
          email: "support@caisty.com",
          name: "Support",
          passwordHash: "x",
          role: "support",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a portal JWT from platform admin operations", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/customers",
      headers: { authorization: `Bearer ${portalToken()}` },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it("accepts a valid superadmin JWT on admin views", async () => {
    const app = await buildApp();
    const headers = { authorization: `Bearer ${superadminToken()}` };
    const customers = await app.inject({
      method: "GET",
      url: "/devices",
      headers,
    });
    const licenses = await app.inject({
      method: "GET",
      url: "/licenses",
      headers,
    });
    expect(customers.statusCode).toBe(200);
    expect(licenses.statusCode).toBe(200);
    await app.close();
  });

  it("rejects missing and expired JWTs", async () => {
    const app = await buildApp();
    const missing = await app.inject({ method: "GET", url: "/devices" });
    expect(missing.statusCode).toBe(401);

    const jwt = await import("jsonwebtoken");
    const { env } = await import("../../config/env.js");
    const expired = jwt.default.sign(
      {
        adminUserId: SUPERADMIN_ID,
        email: "siraj@caisty.com",
        role: "superadmin",
      },
      process.env.ADMIN_JWT_SECRET || env.JWT_SECRET,
      { expiresIn: -5 },
    );
    const res = await app.inject({
      method: "GET",
      url: "/devices",
      headers: { authorization: `Bearer ${expired}` },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("does not let support or admin JWTs bypass superadmin restrictions", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/devices",
      headers: { authorization: `Bearer ${supportToken()}` },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().message).toMatch(/Superadmin/i);
    await app.close();
  });

  it("keeps Portal login and B7 receipt routes reachable without platform admin", async () => {
    const app = await buildApp();
    const login = await app.inject({ method: "GET", url: "/portal/login-check" });
    const receipts = await app.inject({
      method: "GET",
      url: "/portal/receipts",
      headers: { authorization: `Bearer ${portalToken()}` },
    });
    expect(login.statusCode).toBe(200);
    expect(receipts.statusCode).toBe(200);
    expect(receipts.json().b7).toBe(true);
    await app.close();
  });

  it("rejects unauthorized invoice HTML and allows the owning portal customer", async () => {
    const app = await buildApp();
    const anon = await app.inject({
      method: "GET",
      url: `/invoices/${INVOICE_OWN}/html`,
    });
    expect(anon.statusCode).toBe(401);

    const portalOnAdminHtml = await app.inject({
      method: "GET",
      url: `/invoices/${INVOICE_OWN}/html`,
      headers: { authorization: `Bearer ${portalToken()}` },
    });
    expect(portalOnAdminHtml.statusCode).toBe(403);

    const own = await app.inject({
      method: "GET",
      url: `/portal/invoices/${INVOICE_OWN}/html`,
      headers: { authorization: `Bearer ${portalToken()}` },
    });
    expect(own.statusCode).toBe(200);
    expect(own.body).toContain("own-invoice");

    const other = await app.inject({
      method: "GET",
      url: `/portal/invoices/${INVOICE_OTHER}/html`,
      headers: { authorization: `Bearer ${portalToken()}` },
    });
    expect(other.statusCode).toBe(403);

    const adminHtml = await app.inject({
      method: "GET",
      url: `/invoices/${INVOICE_OWN}/html`,
      headers: { authorization: `Bearer ${superadminToken()}` },
    });
    expect(adminHtml.statusCode).toBe(200);
    await app.close();
  });

  it("allows superadmin to archive devices and rejects portal JWT", async () => {
    const app = await buildApp();
    const allowed = await app.inject({
      method: "POST",
      url: "/admin/devices/dev-1/archive",
      headers: { authorization: `Bearer ${superadminToken()}` },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().ok).toBe(true);

    const portal = await app.inject({
      method: "POST",
      url: "/admin/devices/dev-1/archive",
      headers: { authorization: `Bearer ${portalToken()}` },
    });
    expect(portal.statusCode).toBe(403);

    const support = await app.inject({
      method: "POST",
      url: "/admin/devices/dev-1/unarchive",
      headers: { authorization: `Bearer ${supportToken()}` },
    });
    expect(support.statusCode).toBe(403);
    await app.close();
  });

  it("rejects portal JWT on customer status PATCH and still disables hard delete", async () => {
    const app = await buildApp();
    const portal = await app.inject({
      method: "PATCH",
      url: `/customers/${CUSTOMER_ID}/status`,
      headers: { authorization: `Bearer ${portalToken()}` },
      payload: { status: "active" },
    });
    expect(portal.statusCode).toBe(403);

    const support = await app.inject({
      method: "PATCH",
      url: `/customers/${CUSTOMER_ID}/status`,
      headers: { authorization: `Bearer ${supportToken()}` },
      payload: { status: "active" },
    });
    expect(support.statusCode).toBe(403);
    await app.close();
  });

  it("does not hard-delete customers or invoices", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "DELETE",
      url: `/customers/${CUSTOMER_ID}`,
      headers: { authorization: `Bearer ${superadminToken()}` },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe("customer_delete_disabled");
    await app.close();
  });

  it("returns customer JSON without passwordHash", () => {
    const item = toPublicCustomer({
      id: CUSTOMER_ID,
      orgId: ORG_ID,
      name: "Cafe",
      email: "a@b.c",
      status: "active",
      portalStatus: "active",
      profile: {},
      createdAt: new Date().toISOString(),
      passwordHash: "secret-hash",
    });
    expect(JSON.stringify({ items: [item] })).not.toContain("passwordHash");
    expect(JSON.stringify(item)).not.toContain("secret-hash");
  });
});
