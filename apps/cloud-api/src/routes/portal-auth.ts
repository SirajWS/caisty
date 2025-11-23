// apps/cloud-api/src/routes/portal-auth.ts
import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { customers } from "../db/schema/customers";
import { orgs } from "../db/schema/orgs";
import { signPortalToken, verifyPortalToken } from "../lib/portalJwt";

function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const suffix = Date.now().toString(36).slice(-4);
  return `${base || "org"}-${suffix}`;
}

interface RegisterBody {
  name?: string;
  email?: string;
  password?: string;
}

interface LoginBody {
  email?: string;
  password?: string;
}

export async function registerPortalAuthRoutes(app: FastifyInstance) {
  // POST /portal/register
  app.post("/portal/register", async (request, reply) => {
    const raw = request.body as any;

    // erlaubt sowohl {name,email,password} als auch { body: { ... } }
    const body: RegisterBody =
      raw && typeof raw === "object" && "body" in raw ? (raw as any).body : raw;

    const name =
      typeof body?.name === "string" ? body.name.trim() : "";
    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body?.password === "string" ? body.password : "";

    if (!name || !email || password.length < 6) {
      reply.code(400);
      return { ok: false, reason: "invalid_input" as const };
    }

    // schon ein Customer mit der Mail?
    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email));

    if (existing) {
      reply.code(409);
      return { ok: false, reason: "email_taken" as const };
    }

    // Org anlegen
    const slug = makeSlug(name);
    const [org] = await db
      .insert(orgs)
      .values({ name, slug })
      .returning();

    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, 10);

    // Customer anlegen
    const [customer] = await db
      .insert(customers)
      .values({
        orgId: org.id,
        name,
        email,
        passwordHash,
        portalStatus: "active",
      })
      .returning({
        id: customers.id,
        orgId: customers.orgId,
        name: customers.name,
        email: customers.email,
        portalStatus: customers.portalStatus,
      });

    const token = signPortalToken({
      customerId: customer.id,
      orgId: customer.orgId!,
    });

    return { ok: true, token, customer };
  });

  // POST /portal/login
  app.post("/portal/login", async (request, reply) => {
    const raw = request.body as any;
    const body: LoginBody =
      raw && typeof raw === "object" && "body" in raw ? (raw as any).body : raw;

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      reply.code(400);
      return { ok: false, reason: "invalid_input" as const };
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email));

    if (!customer?.passwordHash) {
      reply.code(401);
      return { ok: false, reason: "invalid_credentials" as const };
    }

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      reply.code(401);
      return { ok: false, reason: "invalid_credentials" as const };
    }

    const token = signPortalToken({
      customerId: customer.id,
      orgId: customer.orgId!,
    });

    return {
      ok: true,
      token,
      customer: {
        id: customer.id,
        orgId: customer.orgId,
        name: customer.name,
        email: customer.email,
        portalStatus: customer.portalStatus,
      },
    };
  });

  // GET /portal/me
  app.get("/portal/me", async (request, reply) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      reply.code(401);
      return { ok: false, reason: "invalid_token" as const };
    }

    const token = auth.slice("Bearer ".length);

    try {
      const payload = verifyPortalToken(token);

      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, payload.customerId));

      if (!customer) {
        reply.code(404);
        return { ok: false, reason: "not_found" as const };
      }

      return {
        ok: true,
        customer: {
          id: customer.id,
          orgId: customer.orgId,
          name: customer.name,
          email: customer.email,
          portalStatus: customer.portalStatus,
        },
      };
    } catch (err) {
      request.log.warn({ err }, "invalid portal token");
      reply.code(401);
      return { ok: false, reason: "invalid_token" as const };
    }
  });
}
