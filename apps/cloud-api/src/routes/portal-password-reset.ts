// apps/cloud-api/src/routes/portal-password-reset.ts
import type { FastifyInstance } from "fastify";
import { eq, and, gt, isNull } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { passwordResets } from "../db/schema/passwordResets.js";
import { signPortalToken } from "../lib/portalJwt.js";
import { ENV } from "../config/env.js";

const PORTAL_BASE_URL = ENV.PORTAL_BASE_URL;

/**
 * Generiert einen sicheren Reset-Token
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hasht den Token für die Datenbank
 */
async function hashToken(token: string): Promise<string> {
  return crypto.createHash("sha256").update(token).digest("hex");
}


export async function registerPortalPasswordResetRoutes(app: FastifyInstance) {
  // POST /portal/auth/forgot-password
  app.post("/portal/auth/forgot-password", async (request, reply) => {
    const body = request.body as { email?: string };
    const email = typeof body?.email === "string" 
      ? body.email.trim().toLowerCase() 
      : "";

    if (!email) {
      reply.code(400);
      return { ok: false, error: "E-Mail ist erforderlich" };
    }

    try {
      // Prüfe, ob Customer existiert
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, email))
        .limit(1);

      // Aus Sicherheitsgründen: Immer "OK" zurückgeben, auch wenn Customer nicht existiert
      // (verhindert E-Mail-Enumeration)
      if (!customer) {
        app.log.info({ email }, "Password reset requested for non-existent email");
        return { 
          ok: true, 
          message: "Wenn ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet." 
        };
      }

      // Prüfe, ob Customer ein Passwort hat (Google-User haben keins)
      if (!customer.passwordHash) {
        app.log.info({ email, customerId: customer.id }, "Password reset requested for Google-only account");
        return { 
          ok: true, 
          message: "Wenn ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet." 
        };
      }

      // Generiere Reset-Token
      const resetToken = generateResetToken();
      const tokenHash = await hashToken(resetToken);

      // Token läuft in 1 Stunde ab
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Alte, nicht verwendete Tokens für diesen Customer löschen
      await db
        .delete(passwordResets)
        .where(
          and(
            eq(passwordResets.customerId, customer.id),
            isNull(passwordResets.usedAt),
            gt(passwordResets.expiresAt, new Date()) // Noch nicht abgelaufen
          )
        );

      // Neuen Reset-Token speichern
      await db.insert(passwordResets).values({
        customerId: customer.id,
        tokenHash,
        expiresAt,
      });

      // Reset-Link bauen
      const resetLink = `${PORTAL_BASE_URL}/reset-password?token=${resetToken}`;

      // E-Mail senden
      try {
        const { sendPasswordResetEmail } = await import("../lib/email.js");
        await sendPasswordResetEmail(customer.email, resetLink);
        app.log.info({ email, customerId: customer.id }, "Password reset email sent");
      } catch (emailError) {
        app.log.error({ err: emailError, email }, "Failed to send password reset email");
        // E-Mail-Fehler sollte den Request nicht abbrechen, aber wir loggen es
        // In Development: Link trotzdem zurückgeben
        if (ENV.NODE_ENV === "development") {
          app.log.warn({ resetLink }, "Email sending failed, but returning link in development");
        }
      }

      // Response: In Development Link zurückgeben, in Production nur Message
      const response: any = { 
        ok: true, 
        message: "Wenn ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.",
      };
      
      // In Development: Link immer zurückgeben (für Testing, auch wenn E-Mail fehlschlägt)
      if (ENV.NODE_ENV === "development") {
        response.resetLink = resetLink;
      }
      
      return response;
    } catch (err) {
      app.log.error({ err, email }, "Error processing password reset request");
      reply.code(500);
      return { ok: false, error: "Fehler beim Verarbeiten der Anfrage" };
    }
  });

  // POST /portal/auth/reset-password
  app.post("/portal/auth/reset-password", async (request, reply) => {
    const body = request.body as { token?: string; newPassword?: string };
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token || !newPassword) {
      reply.code(400);
      return { ok: false, error: "Token und neues Passwort sind erforderlich" };
    }

    if (newPassword.length < 6) {
      reply.code(400);
      return { ok: false, error: "Passwort muss mindestens 6 Zeichen lang sein" };
    }

    try {
      // Token hashen
      const tokenHash = await hashToken(token);

      // Reset-Token in DB finden
      const [resetRecord] = await db
        .select({
          id: passwordResets.id,
          customerId: passwordResets.customerId,
          expiresAt: passwordResets.expiresAt,
          usedAt: passwordResets.usedAt,
          customer: customers,
        })
        .from(passwordResets)
        .innerJoin(customers, eq(customers.id, passwordResets.customerId))
        .where(eq(passwordResets.tokenHash, tokenHash))
        .limit(1);

      if (!resetRecord) {
        reply.code(400);
        return { ok: false, error: "Ungültiger oder abgelaufener Reset-Token" };
      }

      // Prüfe, ob Token bereits verwendet wurde
      if (resetRecord.usedAt) {
        reply.code(400);
        return { ok: false, error: "Dieser Reset-Link wurde bereits verwendet" };
      }

      // Prüfe, ob Token abgelaufen ist
      if (resetRecord.expiresAt.getTime() < Date.now()) {
        reply.code(400);
        return { ok: false, error: "Dieser Reset-Link ist abgelaufen. Bitte fordere einen neuen an." };
      }

      // Passwort hashen
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Passwort für Customer aktualisieren
      await db
        .update(customers)
        .set({ passwordHash })
        .where(eq(customers.id, resetRecord.customerId));

      // Token als verwendet markieren
      await db
        .update(passwordResets)
        .set({ usedAt: new Date() })
        .where(eq(passwordResets.id, resetRecord.id));

      // Stelle sicher, dass Provider-Verknüpfung existiert
      const { customerAuthProviders } = await import("../db/schema/customerAuthProviders.js");
      const [existingProvider] = await db
        .select()
        .from(customerAuthProviders)
        .where(
          and(
            eq(customerAuthProviders.customerId, resetRecord.customerId),
            eq(customerAuthProviders.provider, "password")
          )
        )
        .limit(1);

      if (!existingProvider) {
        await db.insert(customerAuthProviders).values({
          customerId: resetRecord.customerId,
          provider: "password",
          providerUserId: null,
          providerEmail: resetRecord.customer.email,
        });
      }

      // Portal-JWT ausstellen (automatisch einloggen)
      const portalToken = signPortalToken({
        customerId: resetRecord.customerId,
        orgId: resetRecord.customer.orgId!,
      });

      app.log.info({ customerId: resetRecord.customerId }, "Password reset successful");

      return {
        ok: true,
        token: portalToken,
        message: "Passwort wurde erfolgreich zurückgesetzt. Du wirst jetzt eingeloggt.",
      };
    } catch (err) {
      app.log.error({ err }, "Error processing password reset");
      reply.code(500);
      return { ok: false, error: "Fehler beim Zurücksetzen des Passworts" };
    }
  });
}

