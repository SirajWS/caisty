// apps/cloud-api/src/lib/email.ts
import nodemailer from "nodemailer";
import { ENV } from "../config/env.js";

// SMTP-Transporter erstellen (einmalig, wird wiederverwendet)
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter(): ReturnType<typeof nodemailer.createTransport> {
  if (transporter) {
    return transporter;
  }

  // SMTP-Konfiguration aus ENV-Variablen
  const smtpHost = ENV.SMTP_HOST || "smtp.zoho.eu";
  const smtpPort = Number(ENV.SMTP_PORT) || 587;
  const smtpUser = ENV.SMTP_USER;
  const smtpPassword = ENV.SMTP_PASSWORD;

  // Wenn keine SMTP-Credentials vorhanden, erstelle einen "Test"-Transporter (für Development)
  if (!smtpUser || !smtpPassword) {
    console.warn(
      "[EMAIL] ⚠️ SMTP_USER oder SMTP_PASSWORD nicht gesetzt!"
    );
    console.warn(
      `[EMAIL] SMTP_USER: ${smtpUser ? "✅ gesetzt" : "❌ NICHT gesetzt"}`
    );
    console.warn(
      `[EMAIL] SMTP_PASSWORD: ${smtpPassword ? "✅ gesetzt" : "❌ NICHT gesetzt"}`
    );
    console.warn(
      "[EMAIL] E-Mails werden NICHT versendet. Bitte ENV-Variablen in .env setzen!"
    );
    throw new Error(
      "SMTP_USER oder SMTP_PASSWORD nicht gesetzt. Bitte ENV-Variablen in .env konfigurieren."
    );
  }

  console.log(`[EMAIL] 🔧 Konfiguriere SMTP: ${smtpHost}:${smtpPort} (User: ${smtpUser})`);

  // Zoho SMTP Transporter
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true für 465, false für andere Ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    // TLS-Optionen für Zoho
    tls: {
      rejectUnauthorized: false, // Für Development, in Production sollte true sein
    },
  });

  return transporter;
}

/**
 * Sendet eine E-Mail
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const transporter = getTransporter();
  // SMTP_FROM kann bereits "Name <email@domain.com>" Format haben
  const smtpFrom = ENV.SMTP_FROM || `Caisty <${ENV.SMTP_USER || "noreply@caisty.com"}>`;

  try {
    console.log(`[EMAIL] 📧 Versende E-Mail an ${options.to}...`);
    console.log(`[EMAIL] Von: ${smtpFrom}`);
    console.log(`[EMAIL] Betreff: ${options.subject}`);
    
    const info = await transporter.sendMail({
      from: smtpFrom, // Kann bereits formatiert sein: "Name <email@domain.com>"
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Plain text aus HTML
    });

    console.log(`[EMAIL] ✅ E-Mail erfolgreich gesendet an ${options.to}`);
    console.log(`[EMAIL] Message-ID: ${info.messageId}`);
    console.log(`[EMAIL] Response: ${info.response}`);
  } catch (error: any) {
    console.error("[EMAIL] ❌ Fehler beim Senden der E-Mail:");
    console.error("[EMAIL] Error Code:", error.code);
    console.error("[EMAIL] Error Message:", error.message);
    console.error("[EMAIL] Full Error:", error);
    
    // Detaillierte Fehler-Info
    if (error.response) {
      console.error("[EMAIL] SMTP Response:", error.response);
    }
    if (error.responseCode) {
      console.error("[EMAIL] SMTP Response Code:", error.responseCode);
    }
    
    throw error;
  }
}

/**
 * Sendet eine Password-Reset-E-Mail für Portal-Kunden
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Caisty Portal</h1>
      <p>Passwort zurücksetzen</p>
    </div>
    <div class="content">
      <p>Hallo,</p>
      <p>du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
      <p>Klicke auf den folgenden Button, um ein neues Passwort zu setzen:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Passwort zurücksetzen</a>
      </p>
      <p>Oder kopiere diesen Link in deinen Browser:</p>
      <p style="word-break: break-all; color: #64748b; font-size: 12px;">${resetLink}</p>
      <p><strong>Wichtig:</strong> Dieser Link ist nur 1 Stunde gültig und kann nur einmal verwendet werden.</p>
      <p>Wenn du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail einfach.</p>
      <p>Viele Grüße,<br>Dein Caisty Team</p>
    </div>
    <div class="footer">
      <p>Caisty POS & Cloud Platform</p>
      <p>Bei Fragen: support@caisty.com</p>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail({
    to: email,
    subject: "Passwort zurücksetzen - Caisty Portal",
    html,
  });
}

/**
 * Sendet eine Password-Reset-E-Mail für Admin-User
 */
export async function sendAdminPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #020617 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Caisty Admin</h1>
      <p>Passwort zurücksetzen</p>
    </div>
    <div class="content">
      <p>Hallo,</p>
      <p>du hast eine Anfrage zum Zurücksetzen deines Admin-Passworts gestellt.</p>
      <p>Klicke auf den folgenden Button, um ein neues Passwort zu setzen:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Passwort zurücksetzen</a>
      </p>
      <p>Oder kopiere diesen Link in deinen Browser:</p>
      <p style="word-break: break-all; color: #64748b; font-size: 12px;">${resetLink}</p>
      <p><strong>Wichtig:</strong> Dieser Link ist nur 1 Stunde gültig und kann nur einmal verwendet werden.</p>
      <p>Wenn du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail einfach.</p>
      <p>Viele Grüße,<br>Caisty Admin Team</p>
    </div>
    <div class="footer">
      <p>Caisty Admin Portal</p>
      <p>Bei Fragen: admin@caisty.com</p>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail({
    to: email,
    subject: "Passwort zurücksetzen - Caisty Admin",
    html,
  });
}
