// apps/cloud-api/src/routes/portalAuthRoutes.ts
import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { orgs } from "../db/schema/orgs.js";
import { licenses } from "../db/schema/licenses.js";
import { notifications } from "../db/schema/notifications.js";
import { customerAuthProviders } from "../db/schema/customerAuthProviders.js";
import { signPortalToken, verifyPortalToken } from "../lib/portalJwt.js";

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

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
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

    // Provider-Verknüpfung für Passwort-Login anlegen
    await db.insert(customerAuthProviders).values({
      customerId: customer.id,
      provider: "password",
      providerUserId: null,
      providerEmail: email,
    });

    const token = signPortalToken({
      customerId: customer.id,
      orgId: customer.orgId!,
    });

    // Notification für Admin: Neues Portal-Konto
    await db.insert(notifications).values({
      orgId: customer.orgId!,
      type: "portal_signup",
      title: `Neues Portal-Konto: ${customer.name || customer.email}`,
      body: `E-Mail: ${customer.email}`,
      customerId: customer.id,
      licenseId: null,
      data: { email: customer.email },
    });

    return { ok: true, token, customer };
  });

  // POST /portal/login
  app.post("/portal/login", async (request, reply) => {
    const raw = request.body as any;
    const body: LoginBody =
      raw && typeof raw === "object" && "body" in raw ? (raw as any).body : raw;

    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
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

    if (!customer) {
      reply.code(401);
      return { ok: false, reason: "invalid_credentials" as const };
    }

    // Prüfe, ob Customer ein Passwort hat
    if (!customer.passwordHash) {
      // Customer hat nur Google-Auth → Fehlermeldung
      reply.code(401);
      return { 
        ok: false, 
        reason: "google_auth_required" as const,
        message: "Dieses Konto wurde mit Google erstellt. Bitte melde dich mit Google an." 
      };
    }

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      reply.code(401);
      return { ok: false, reason: "invalid_credentials" as const };
    }

    // Stelle sicher, dass Provider-Verknüpfung existiert (für bestehende Accounts)
    const [existingProvider] = await db
      .select()
      .from(customerAuthProviders)
      .where(
        and(
          eq(customerAuthProviders.customerId, customer.id),
          eq(customerAuthProviders.provider, "password")
        )
      )
      .limit(1);

    if (!existingProvider) {
      // Provider-Verknüpfung fehlt → anlegen (für alte Accounts)
      await db.insert(customerAuthProviders).values({
        customerId: customer.id,
        provider: "password",
        providerUserId: null,
        providerEmail: email,
      });
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

      // Primäre aktive Lizenz für Konto-Ansicht holen (optional)
      const [primaryLicense] = await db
        .select({
          id: licenses.id,
          key: licenses.key,
          plan: licenses.plan,
          status: licenses.status,
          validUntil: licenses.validUntil,
        })
        .from(licenses)
        .where(
          and(
            eq(licenses.orgId, customer.orgId!),
            eq(licenses.customerId, customer.id),
            eq(licenses.status, "active"),
          ),
        )
        .orderBy(desc(licenses.validUntil))
        .limit(1);

      return {
        ok: true,
        customer: {
          id: customer.id,
          orgId: customer.orgId,
          name: customer.name,
          email: customer.email,
          portalStatus: customer.portalStatus,
          primaryLicense: primaryLicense
            ? {
                id: primaryLicense.id,
                key: primaryLicense.key,
                plan: primaryLicense.plan,
                status: primaryLicense.status,
                validUntil: primaryLicense.validUntil
                  ? primaryLicense.validUntil.toISOString()
                  : null,
              }
            : null,
        },
      };
    } catch (err) {
      request.log.warn({ err }, "invalid portal token");
      reply.code(401);
      return { ok: false, reason: "invalid_token" as const };
    }
  });

  // PATCH /portal/account – Name / E-Mail aktualisieren
  app.patch("/portal/account", async (request, reply) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      reply.code(401);
      return { ok: false, reason: "invalid_token" as const };
    }

    const token = auth.slice("Bearer ".length);

    let payload: { customerId: string; orgId: string };
    try {
      payload = verifyPortalToken(token) as any;
    } catch (err) {
      request.log.warn({ err }, "invalid portal token");
      reply.code(401);
      return { ok: false, reason: "invalid_token" as const };
    }

    const body = request.body as { name?: string; email?: string };

    const updates: { name?: string; email?: string } = {};

    if (typeof body?.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }

    if (typeof body?.email === "string" && body.email.trim()) {
      updates.email = body.email.trim().toLowerCase();
    }

    if (Object.keys(updates).length === 0) {
      reply.code(400);
      return { ok: false, reason: "no_changes" as const };
    }

    // Wenn E-Mail geändert wird: prüfen, ob sie bereits vergeben ist
    if (updates.email) {
      const [existing] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, updates.email));

      if (existing && existing.id !== payload.customerId) {
        reply.code(409);
        return { ok: false, reason: "email_taken" as const };
      }
    }

    const [updated] = await db
      .update(customers)
      .set(updates)
      .where(eq(customers.id, payload.customerId))
      .returning({
        id: customers.id,
        orgId: customers.orgId,
        name: customers.name,
        email: customers.email,
        portalStatus: customers.portalStatus,
      });

    if (!updated) {
      reply.code(404);
      return { ok: false, reason: "not_found" as const };
    }

    return { ok: true, customer: updated };
  });

  // POST /portal/change-password – Passwort ändern
  app.post("/portal/change-password", async (request, reply) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      reply.code(401);
      return { ok: false, reason: "invalid_token" as const };
    }

    const token = auth.slice("Bearer ".length);

    let payload: { customerId: string; orgId: string };
    try {
      payload = verifyPortalToken(token) as any;
    } catch (err) {
      request.log.warn({ err }, "invalid portal token");
      reply.code(401);
      return { ok: false, reason: "invalid_token" as const };
    }

    const body = request.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword =
      typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || newPassword.length < 6) {
      reply.code(400);
      return { ok: false, reason: "invalid_input" as const };
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, payload.customerId));

    if (!customer?.passwordHash) {
      reply.code(401);
      return { ok: false, reason: "invalid_credentials" as const };
    }

    const valid = await bcrypt.compare(currentPassword, customer.passwordHash);
    if (!valid) {
      reply.code(401);
      return { ok: false, reason: "invalid_credentials" as const };
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(customers)
      .set({ passwordHash: newHash })
      .where(eq(customers.id, payload.customerId));

    return { ok: true };
  });
}

// Fallback: falls irgendwo noch portalAuthRoutes importiert wird
export const portalAuthRoutes = registerPortalAuthRoutes;
