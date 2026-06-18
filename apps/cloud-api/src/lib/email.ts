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
 * Sends email verification for new portal signups.
 */
export async function sendEmailVerificationEmail(
  email: string,
  verifyLink: string,
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .footer { margin-top: 20px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Caisty Portal</h1>
      <p>Verify your email</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Please confirm your email address to activate your Caisty account.</p>
      <p>This link expires in 24 hours.</p>
      <p style="text-align: center;">
        <a href="${verifyLink}" class="button">Verify email</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #64748b; font-size: 12px;">${verifyLink}</p>
      <p>If you did not create a Caisty account, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>Caisty Portal</p>
      <p>Questions: support@caisty.com</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = [
    "Hello,",
    "",
    "Please confirm your email address to activate your Caisty account.",
    "",
    "This link expires in 24 hours.",
    "",
    verifyLink,
    "",
    "If you did not create a Caisty account, you can safely ignore this email.",
    "",
    "Caisty Portal",
    "Questions: support@caisty.com",
  ].join("\n");

  await sendEmail({
    to: email,
    subject: "Verify your Caisty email address",
    html,
    text,
  });
}

/**
 * Sends a password-reset email for portal customers.
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
      <p>Reset your password</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We received a request to reset the password for your Caisty Portal account.</p>
      <p>Click the button below to choose a new password:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Reset password</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #64748b; font-size: 12px;">${resetLink}</p>
      <p><strong>Important note:</strong> This link is valid for 1 hour and can only be used once.</p>
      <p><strong>Security note:</strong> If you did not request a password reset, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>Caisty Portal</p>
      <p>Questions: support@caisty.com</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = [
    "Hello,",
    "",
    "We received a request to reset the password for your Caisty Portal account.",
    "",
    "Click the link below to choose a new password:",
    resetLink,
    "",
    "Or copy and paste this link into your browser:",
    resetLink,
    "",
    "Important note: This link is valid for 1 hour and can only be used once.",
    "",
    "Security note: If you did not request a password reset, you can safely ignore this email.",
    "",
    "Caisty Portal",
    "Questions: support@caisty.com",
  ].join("\n");

  await sendEmail({
    to: email,
    subject: "Reset your password - Caisty Portal",
    html,
    text,
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
