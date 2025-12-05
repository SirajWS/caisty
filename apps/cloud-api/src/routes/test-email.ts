// apps/cloud-api/src/routes/test-email.ts
// Test-Endpoint für E-Mail-Versand (nur in Development)
import type { FastifyInstance } from "fastify";
import { ENV } from "../config/env.js";
import { sendEmail } from "../lib/email.js";

export async function registerTestEmailRoutes(app: FastifyInstance) {
  // GET /test-email/config - Zeigt SMTP-Konfiguration (ohne Passwort)
  app.get("/test-email/config", async (request, reply) => {
    return {
      smtpHost: ENV.SMTP_HOST,
      smtpPort: ENV.SMTP_PORT,
      smtpUser: ENV.SMTP_USER || "❌ NICHT GESETZT",
      smtpPassword: ENV.SMTP_PASSWORD ? "✅ gesetzt" : "❌ NICHT GESETZT",
      smtpFrom: ENV.SMTP_FROM,
      nodeEnv: ENV.NODE_ENV,
    };
  });

  // GET /test-email - Test-E-Mail senden
  app.get("/test-email", async (request, reply) => {
    // Nur in Development erlauben
    if (ENV.NODE_ENV !== "development") {
      reply.code(403);
      return { error: "Test-Endpoint nur in Development verfügbar" };
    }

    const query = request.query as { to?: string };
    const testEmail = query.to || "siraj@caisty.com";

    // Zuerst Konfiguration prüfen
    const config = {
      smtpHost: ENV.SMTP_HOST,
      smtpPort: ENV.SMTP_PORT,
      smtpUser: ENV.SMTP_USER,
      smtpPassword: ENV.SMTP_PASSWORD,
      smtpFrom: ENV.SMTP_FROM,
    };

    if (!config.smtpUser || !config.smtpPassword) {
      reply.code(400);
      return {
        ok: false,
        error: "SMTP-Konfiguration unvollständig",
        config: {
          ...config,
          smtpPassword: config.smtpPassword ? "✅ gesetzt" : "❌ nicht gesetzt",
        },
        message: "Bitte setze SMTP_USER und SMTP_PASSWORD in der .env-Datei und starte den Server neu!",
      };
    }

    try {
      console.log(`[TEST-EMAIL] 📧 Versuche Test-E-Mail an ${testEmail} zu senden...`);
      console.log(`[TEST-EMAIL] Konfiguration:`, {
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
        from: config.smtpFrom,
      });

      await sendEmail({
        to: testEmail,
        subject: "Test-E-Mail von Caisty API",
        html: `
          <h1>Test-E-Mail</h1>
          <p>Dies ist eine Test-E-Mail von der Caisty API.</p>
          <p>Wenn du diese E-Mail erhältst, funktioniert der E-Mail-Versand korrekt! ✅</p>
          <p><strong>SMTP-Konfiguration:</strong></p>
          <ul>
            <li>Host: ${ENV.SMTP_HOST}</li>
            <li>Port: ${ENV.SMTP_PORT}</li>
            <li>User: ${ENV.SMTP_USER ? "✅ gesetzt" : "❌ nicht gesetzt"}</li>
            <li>Password: ${ENV.SMTP_PASSWORD ? "✅ gesetzt" : "❌ nicht gesetzt"}</li>
            <li>From: ${ENV.SMTP_FROM}</li>
          </ul>
        `,
      });

      return {
        ok: true,
        message: `Test-E-Mail wurde an ${testEmail} gesendet. Bitte Postfach prüfen.`,
        config: {
          ...config,
          smtpPassword: "✅ gesetzt",
        },
      };
    } catch (error: any) {
      console.error(`[TEST-EMAIL] ❌ Fehler:`, error);
      reply.code(500);
      return {
        ok: false,
        error: "Fehler beim Senden der Test-E-Mail",
        details: error.message,
        code: error.code,
        stack: ENV.NODE_ENV === "development" ? error.stack : undefined,
        config: {
          ...config,
          smtpPassword: config.smtpPassword ? "✅ gesetzt" : "❌ nicht gesetzt",
        },
      };
    }
  });
}

