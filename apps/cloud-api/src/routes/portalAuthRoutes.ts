// apps/cloud-api/src/routes/portalAuthRoutes.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { db } from "../db"; // ggf. Pfad anpassen
import { customers } from "../db/schema/customers";
import { orgs } from "../db/schema/orgs";
import { subscriptions } from "../db/schema/subscriptions";
import { licenses } from "../db/schema/licenses";
import { devices } from "../db/schema/devices";
import { eq, and, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  signPortalToken,
  verifyPortalToken,
} from "../lib/portalJwt";

function makeSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

type RegisterBody = {
  name: string;
  email: string;
  password: string;
};

type LoginBody = {
  email: string;
  password: string;
};

async function getPortalUserFromRequest(
  request: FastifyRequest
) {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("Missing token");
  }
  const token = auth.slice("Bearer ".length);
  const payload = verifyPortalToken(token);

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, payload.sub));

  if (!customer) {
    throw new Error("Customer not found");
  }

  const [org] = await db
    .select()
    .from(orgs)
    .where(eq(orgs.id, payload.orgId));

  if (!org) {
    throw new Error("Org not found");
  }

  return { payload, customer, org };
}

export async function portalAuthRoutes(app: FastifyInstance) {
  // POST /portal/register
  app.post<{ Body: RegisterBody }>("/portal/register", async (request, reply) => {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return reply
        .code(400)
        .send({ ok: false, reason: "missing_fields" });
    }

    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email));

    if (existing && existing.passwordHash) {
      return reply
        .code(400)
        .send({ ok: false, reason: "email_taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Neue Org + Customer anlegen (füge slug hinzu damit DB NOT NULL erfüllt ist)
    const slugBase = makeSlug(name || "org");
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const [org] = await db
      .insert(orgs)
      .values({
        name,
        slug,
      })
      .returning();

    const [customer] = await db
      .insert(customers)
      .values({
        orgId: org.id,
        name,
        email,
        passwordHash,
        portalStatus: "active",
        status: "active",
      })
      .returning();

    const token = signPortalToken({
      customerId: customer.id,
      orgId: org.id,
    });

    return {
      ok: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      org: {
        id: org.id,
        name: org.name,
      },
    };
  });

  // POST /portal/login
  app.post<{ Body: LoginBody }>("/portal/login", async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply
        .code(400)
        .send({ ok: false, reason: "missing_fields" });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email));

    if (!customer || !customer.passwordHash) {
      return reply
        .code(401)
        .send({ ok: false, reason: "invalid_credentials" });
    }

    if (customer.portalStatus === "disabled") {
      return reply
        .code(403)
        .send({ ok: false, reason: "portal_disabled" });
    }

    const ok = await bcrypt.compare(
      password,
      customer.passwordHash
    );
    if (!ok) {
      return reply
        .code(401)
        .send({ ok: false, reason: "invalid_credentials" });
    }

    const [org] = await db
      .select()
      .from(orgs)
      .where(eq(orgs.id, customer.orgId));

    if (!org) {
      return reply
        .code(500)
        .send({ ok: false, reason: "org_missing" });
    }

    const token = signPortalToken({
      customerId: customer.id,
      orgId: org.id,
    });

    return {
      ok: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      org: {
        id: org.id,
        name: org.name,
      },
    };
  });

  // GET /portal/me
  app.get("/portal/me", async (request, reply) => {
    try {
      const { customer, org } = await getPortalUserFromRequest(
        request
      );

      const [{ subscriptionsCount }] = await db
        .select({
          subscriptionsCount: count(),
        })
        .from(subscriptions)
        .where(eq(subscriptions.customerId, customer.id));

      const [{ licensesCount }] = await db
        .select({
          licensesCount: count(),
        })
        .from(licenses)
        .where(eq(licenses.customerId, customer.id));

      const [{ devicesCount }] = await db
        .select({
          devicesCount: count(),
        })
        .from(devices)
        .where(eq(devices.orgId, org.id));

      return {
        ok: true,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
        org: {
          id: org.id,
          name: org.name,
        },
        stats: {
          subscriptions: subscriptionsCount,
          licenses: licensesCount,
          devices: devicesCount,
        },
      };
    } catch (err) {
      request.log.error(err);
      return reply
        .code(401)
        .send({ ok: false, reason: "invalid_token" });
    }
  });
}
