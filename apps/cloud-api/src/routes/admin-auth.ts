// apps/cloud-api/src/routes/admin-auth.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { db } from "../db/client.js";
import { adminUsers } from "../db/schema/adminUsers.js";
import { adminPasswordResets } from "../db/schema/adminPasswordResets.js";
import { eq, and, sql, isNull } from "drizzle-orm";
import { verifyPassword, hashPassword } from "../lib/passwords.js";
import { signAdminToken, verifyAdminToken, type AdminJwtPayload } from "../lib/adminJwt.js";
import crypto from "node:crypto";
import { addHours } from "date-fns";
import { env } from "../config/env.js";

// Helper: Token generieren und hashen
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Middleware: Admin-Auth prüfen
export function getAdminAuth(request: FastifyRequest): AdminJwtPayload | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    return verifyAdminToken(token);
  } catch {
    return null;
  }
}

// Middleware: Require Admin Auth
export function requireAdminAuth(request: FastifyRequest): AdminJwtPayload {
  const admin = getAdminAuth(request);
  if (!admin) {
    throw new Error("Unauthorized");
  }
  return admin;
}

// Middleware: Require Superadmin
export function requireSuperadmin(request: FastifyRequest): AdminJwtPayload {
  const admin = requireAdminAuth(request);
  if (admin.role !== "superadmin") {
    throw new Error("Forbidden: Superadmin access required");
  }
  return admin;
}

export async function registerAdminAuthRoutes(app: FastifyInstance) {
  // POST /admin/auth/login
  app.post("/admin/auth/login", async (request, reply) => {
    const body = request.body as { email?: string; password?: string };

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      reply.code(400);
      return { ok: false, error: "E-Mail und Passwort sind erforderlich" };
    }

    try {
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true)))
        .limit(1);

      if (!admin) {
        reply.code(401);
        return { ok: false, error: "E-Mail oder Passwort falsch" };
      }

      const valid = await verifyPassword(password, admin.passwordHash);
      if (!valid) {
        reply.code(401);
        return { ok: false, error: "E-Mail oder Passwort falsch" };
      }

      const token = signAdminToken({
        adminUserId: admin.id,
        email: admin.email,
        role: admin.role,
      });

      return {
        ok: true,
        token,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      };
    } catch (err) {
      app.log.error({ err, email }, "Error in admin login");
      reply.code(500);
      return { ok: false, error: "Fehler beim Login" };
    }
  });

  // POST /admin/auth/forgot-password
  app.post("/admin/auth/forgot-password", async (request, reply) => {
    const body = request.body as { email?: string };
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      reply.code(400);
      return { ok: false, error: "E-Mail ist erforderlich" };
    }

    try {
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email))
        .limit(1);

      // E-Mail-Enumeration verhindern: Immer "OK" zurückgeben
      if (!admin || !admin.isActive) {
        app.log.info({ email }, "Forgot password request for non-existent or inactive admin - returning OK");
        return {
          ok: true,
          message: "Wenn ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen des Passworts gesendet.",
        };
      }

      // Alte, unbenutzte Tokens invalidieren
      await db
        .update(adminPasswordResets)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(adminPasswordResets.adminUserId, admin.id),
            isNull(adminPasswordResets.usedAt),
            sql`${adminPasswordResets.expiresAt} > NOW()`
          )
        );

      const token = generateToken();
      const tokenHash = hashToken(token);
      const expiresAt = addHours(new Date(), 1); // 1 Stunde gültig

      await db.insert(adminPasswordResets).values({
        adminUserId: admin.id,
        tokenHash,
        expiresAt,
      });

      // Admin-Reset-Link nutzt eigene Basis-URL (ADMIN_BASE_URL)
      const adminBaseUrl = env.ADMIN_BASE_URL || "http://localhost:5173";
      const resetLink = `${adminBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
      
      app.log.info({ email, resetLink, tokenHash: tokenHash.substring(0, 8) + "..." }, "Admin password reset link generated");

      // E-Mail senden
      try {
        const { sendAdminPasswordResetEmail } = await import("../lib/email.js");
        await sendAdminPasswordResetEmail(admin.email, resetLink);
        app.log.info({ email }, "Admin password reset email sent");
      } catch (emailError) {
        app.log.error({ err: emailError, email }, "Failed to send admin password reset email");
        // E-Mail-Fehler sollte den Request nicht abbrechen, aber wir loggen es
        // In Development: Link trotzdem zurückgeben
        if (env.NODE_ENV === "development") {
          app.log.warn({ resetLink }, "Email sending failed, but returning link in development");
        }
      }

      return {
        ok: true,
        message: "Wenn ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen des Passworts gesendet.",
        // In Development: Link zurückgeben (für Testing, auch wenn E-Mail fehlschlägt)
        ...(env.NODE_ENV === "development" && { resetLink }),
      };
    } catch (err) {
      app.log.error({ err, email }, "Error in admin forgot password");
      reply.code(500);
      return { ok: false, error: "Fehler beim Verarbeiten der Anfrage" };
    }
  });

  // POST /admin/auth/reset-password
  app.post("/admin/auth/reset-password", async (request, reply) => {
    const body = request.body as { token?: string; newPassword?: string };
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token || !newPassword || newPassword.length < 6) {
      reply.code(400);
      return { ok: false, error: "Token und neues Passwort (min. 6 Zeichen) sind erforderlich" };
    }

    try {
      const tokenHash = hashToken(token);
      app.log.info({ tokenHash: tokenHash.substring(0, 8) + "...", tokenLength: token.length }, "Checking admin reset token");

      const [resetEntry] = await db
        .select()
        .from(adminPasswordResets)
        .where(
          and(
            eq(adminPasswordResets.tokenHash, tokenHash),
            isNull(adminPasswordResets.usedAt),
            sql`${adminPasswordResets.expiresAt} > NOW()`
          )
        )
        .limit(1);

      if (!resetEntry) {
        // Debug: Prüfe, ob Token existiert, aber abgelaufen oder verwendet
        const [anyEntry] = await db
          .select()
          .from(adminPasswordResets)
          .where(eq(adminPasswordResets.tokenHash, tokenHash))
          .limit(1);
        
        if (anyEntry) {
          const isExpired = anyEntry.expiresAt.getTime() < Date.now();
          const isUsed = anyEntry.usedAt !== null;
          app.log.warn({ 
            isExpired, 
            isUsed, 
            expiresAt: anyEntry.expiresAt.toISOString(),
            usedAt: anyEntry.usedAt?.toISOString() || null,
          }, "Token found but invalid (expired or used)");
        } else {
          app.log.warn({ tokenHash: tokenHash.substring(0, 8) + "..." }, "Token not found in database");
        }
        
        reply.code(400);
        return { ok: false, error: "Ungültiger oder abgelaufener Token" };
      }

      app.log.info({ adminUserId: resetEntry.adminUserId }, "Admin reset token validated successfully");

      // Token als verwendet markieren
      await db
        .update(adminPasswordResets)
        .set({ usedAt: new Date() })
        .where(eq(adminPasswordResets.id, resetEntry.id));

      // Passwort aktualisieren
      const passwordHash = await hashPassword(newPassword);
      await db
        .update(adminUsers)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(adminUsers.id, resetEntry.adminUserId));

      return { ok: true, message: "Passwort wurde erfolgreich zurückgesetzt" };
    } catch (err) {
      app.log.error({ err }, "Error in admin reset password");
      reply.code(500);
      return { ok: false, error: "Fehler beim Zurücksetzen des Passworts" };
    }
  });

  // GET /admin/auth/me
  app.get("/admin/auth/me", async (request, reply) => {
    try {
      const adminPayload = requireAdminAuth(request);

      const [admin] = await db
        .select({
          id: adminUsers.id,
          email: adminUsers.email,
          name: adminUsers.name,
          role: adminUsers.role,
        })
        .from(adminUsers)
        .where(and(eq(adminUsers.id, adminPayload.adminUserId), eq(adminUsers.isActive, true)))
        .limit(1);

      if (!admin) {
        reply.code(404);
        return { ok: false, error: "Admin-User nicht gefunden" };
      }

      return {
        ok: true,
        user: admin,
      };
    } catch (err) {
      app.log.error({ err }, "Error in admin /me");
      reply.code(401);
      return { ok: false, error: "Unauthorized" };
    }
  });
}

