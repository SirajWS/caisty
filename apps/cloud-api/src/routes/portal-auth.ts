// apps/cloud-api/src/routes/portal-auth.ts
import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import sql from "../db/sql";
import { signPortalToken, verifyPortalToken } from "../lib/portalJwt";

// Hilfstyp für SELECTs aus customers
type CustomerRow = {
  id: string;
  org_id: string | null;
  name: string;
  email: string;
  password_hash: string | null;
  portal_status: string;
};

// einfachen Slug aus dem Namen bauen
function makeSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // Akzente weg
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "org";

  return base;
}

export async function registerPortalAuthRoutes(app: FastifyInstance) {
  // POST /portal/register
  app.post("/portal/register", async (request, reply) => {
    const body = request.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body?.name?.trim();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password ?? "";

    if (!name || !email || !password) {
      reply.code(400);
      return reply.send({ ok: false, reason: "missing_fields" });
    }

    // Prüfen, ob es die E-Mail schon gibt
    const existing = await sql<CustomerRow[]>`
      select id, email
      from customers
      where email = ${email}
      limit 1
    `;

    if (existing.length > 0) {
      reply.code(400);
      return reply.send({ ok: false, reason: "email_exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Org mit slug anlegen (bei Kollision neuen Slug probieren)
    const baseSlug = makeSlug(name);
    let slug = baseSlug;
    let orgId: string | null = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const [org] = await sql<{ id: string }[]>`
          insert into orgs (name, slug)
          values (${name}, ${slug})
          returning id
        `;
        orgId = org.id;
        break;
      } catch (err: any) {
        // 23505 = unique_violation (wahrscheinlich slug unique)
        if (err?.code === "23505") {
          slug = `${baseSlug}-${attempt + 2}`;
          continue;
        }

        request.log.error({ err }, "failed to insert org");
        reply.code(500);
        return reply.send({ ok: false, reason: "internal_error" });
      }
    }

    if (!orgId) {
      reply.code(500);
      return reply.send({ ok: false, reason: "could_not_create_org" });
    }

    // Customer mit Passwort & portal_status anlegen
    const [customer] = await sql<CustomerRow[]>`
      insert into customers (org_id, name, email, password_hash, portal_status)
      values (${orgId}, ${name}, ${email}, ${passwordHash}, 'active')
      returning id, org_id, name, email, password_hash, portal_status
    `;

    const token = signPortalToken({
      customerId: customer.id,
      orgId: customer.org_id ?? orgId,
    });

    return reply.send({
      ok: true,
      token,
      customer: {
        id: customer.id,
        orgId: customer.org_id ?? orgId,
        name: customer.name,
        email: customer.email,
        portalStatus: customer.portal_status,
      },
    });
  });

  // POST /portal/login
  app.post("/portal/login", async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password ?? "";

    if (!email || !password) {
      reply.code(400);
      return reply.send({ ok: false, reason: "missing_fields" });
    }

    const rows = await sql<CustomerRow[]>`
      select id, org_id, name, email, password_hash, portal_status
      from customers
      where email = ${email}
      limit 1
    `;

    const customer = rows[0];

    if (!customer || !customer.password_hash) {
      reply.code(401);
      return reply.send({ ok: false, reason: "invalid_credentials" });
    }

    const ok = await bcrypt.compare(password, customer.password_hash);
    if (!ok) {
      reply.code(401);
      return reply.send({ ok: false, reason: "invalid_credentials" });
    }

    const token = signPortalToken({
      customerId: customer.id,
      orgId: customer.org_id!,
    });

    return reply.send({
      ok: true,
      token,
      customer: {
        id: customer.id,
        orgId: customer.org_id,
        name: customer.name,
        email: customer.email,
        portalStatus: customer.portal_status,
      },
    });
  });

  // GET /portal/me
  app.get("/portal/me", async (request, reply) => {
    const auth = request.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      reply.code(401);
      return reply.send({ ok: false, reason: "invalid_token" });
    }

    const token = auth.slice("Bearer ".length);

    try {
      const payload = verifyPortalToken(token);

      const rows = await sql<CustomerRow[]>`
        select id, org_id, name, email, portal_status
        from customers
        where id = ${payload.customerId}
        limit 1
      `;

      const customer = rows[0];
      if (!customer) {
        reply.code(404);
        return reply.send({ ok: false, reason: "not_found" });
      }

      return reply.send({
        ok: true,
        customer: {
          id: customer.id,
          orgId: customer.org_id,
          name: customer.name,
          email: customer.email,
          portalStatus: customer.portal_status,
        },
      });
    } catch (err) {
      request.log.warn({ err }, "invalid portal token");
      reply.code(401);
      return reply.send({ ok: false, reason: "invalid_token" });
    }
  });
}
