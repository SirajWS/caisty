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

/** Official Caisty mark hosted on the public site (absolute HTTPS for email clients). */
export const CAISTY_EMAIL_LOGO_URL = "https://www.caisty.com/caisty-icon.png";

/** Caisty marketing accent (--mkt-accent); used for CTA and accent line. */
export const CAISTY_BRAND_ORANGE = "#ea580c";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type TransactionalEmailContent = {
  subject: string;
  preheader: string;
  eyebrow: string;
  heading: string;
  intro: string;
  ctaLabel: string;
  actionLink: string;
  notices: string[];
  textBody: string[];
};

/**
 * Shared light Caisty card layout for portal transactional emails.
 * Keeps Reset and Verification visually consistent without a larger mail framework.
 */
function buildTransactionalEmail(content: TransactionalEmailContent): {
  subject: string;
  html: string;
  text: string;
} {
  const safeLink = escapeHtml(content.actionLink);
  const noticeHtml = content.notices
    .map(
      (notice, index) =>
        `<p style="margin:0 0 ${index === content.notices.length - 1 ? "20" : "8"}px 0;font-size:16px;line-height:1.6;color:#44403c;">${notice}</p>`,
    )
    .join("\n              ");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(content.subject)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f5f2ee;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(content.preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#f5f2ee;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e5e0d8;border-radius:8px;">
          <tr>
            <td style="padding:28px 28px 16px 28px;text-align:center;">
              <img src="${CAISTY_EMAIL_LOGO_URL}" width="56" height="56" alt="Caisty" style="display:block;margin:0 auto 10px auto;border:0;outline:none;text-decoration:none;width:56px;height:56px;" />
              <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.3;font-weight:bold;color:#1c1917;">Caisty</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.4;color:#78716c;">${escapeHtml(content.eyebrow)}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:16px;">
                <tr>
                  <td style="height:3px;line-height:3px;font-size:0;background-color:${CAISTY_BRAND_ORANGE};">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px 28px;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
              <h1 style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;font-weight:bold;color:#1c1917;">${escapeHtml(content.heading)}</h1>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#44403c;">
                ${escapeHtml(content.intro)}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:8px 0 20px 0;">
                <tr>
                  <td align="center" bgcolor="${CAISTY_BRAND_ORANGE}" style="border-radius:6px;background-color:${CAISTY_BRAND_ORANGE};">
                    <a href="${safeLink}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.25;color:#ffffff;text-decoration:none;border-radius:6px;background-color:${CAISTY_BRAND_ORANGE};">${escapeHtml(content.ctaLabel)}</a>
                  </td>
                </tr>
              </table>
              ${noticeHtml}
              <p style="margin:0 0 8px 0;font-size:14px;line-height:1.5;color:#78716c;">
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#57534e;word-break:break-all;overflow-wrap:anywhere;">
                <a href="${safeLink}" style="color:${CAISTY_BRAND_ORANGE};text-decoration:underline;">${safeLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px 28px;border-top:1px solid #e5e0d8;font-family:Arial,Helvetica,sans-serif;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#57534e;">Caisty &mdash; SaaS products &amp; digital solutions</p>
              <p style="margin:0 0 8px 0;font-size:12px;line-height:1.5;color:#78716c;">This is an automated security email. Please do not reply.</p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#78716c;">
                <a href="https://caisty.com" style="color:#78716c;text-decoration:underline;">caisty.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    ...content.textBody,
    "",
    "This is an automated security email. Please do not reply.",
    "",
    "Caisty - SaaS products & digital solutions",
    "caisty.com",
  ].join("\n");

  return { subject: content.subject, html, text };
}

/**
 * Builds portal email-verification content (HTML + text + subject).
 * Does not send mail; callers pass the already-generated verify URL unchanged.
 */
export function buildEmailVerificationEmail(verifyLink: string): {
  subject: string;
  html: string;
  text: string;
} {
  return buildTransactionalEmail({
    subject: "Verify your Caisty email address",
    preheader: "Confirm your email to activate your Caisty account.",
    eyebrow: "Account activation",
    heading: "Verify your email",
    intro:
      "Please confirm your email address to activate your Caisty account. Use the button below to continue.",
    ctaLabel: "Verify email",
    actionLink: verifyLink,
    notices: [
      "This link is valid for 24 hours.",
      "<strong style=\"color:#1c1917;\">Security note:</strong> If you did not create a Caisty account, you can safely ignore this email.",
    ],
    textBody: [
      "Verify your Caisty email address",
      "",
      "Please confirm your email address to activate your Caisty account.",
      "",
      "Open this link to verify your email:",
      verifyLink,
      "",
      "This link is valid for 24 hours.",
      "",
      "Security note: If you did not create a Caisty account, you can safely ignore this email.",
    ],
  });
}

/**
 * Sends email verification for new portal signups.
 */
export async function sendEmailVerificationEmail(
  email: string,
  verifyLink: string,
): Promise<void> {
  const { subject, html, text } = buildEmailVerificationEmail(verifyLink);

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

/**
 * Builds portal password-reset email content (HTML + text + subject).
 * Does not send mail; callers pass the already-generated reset URL unchanged.
 */
export function buildPasswordResetEmail(resetLink: string): {
  subject: string;
  html: string;
  text: string;
} {
  return buildTransactionalEmail({
    subject: "Reset your Caisty password",
    preheader: "Reset your Caisty password securely.",
    eyebrow: "Secure account access",
    heading: "Reset your password",
    intro:
      "We received a request to reset the password for your Caisty account. Use the button below to choose a new password.",
    ctaLabel: "Reset password",
    actionLink: resetLink,
    notices: [
      "This link is valid for 1 hour and can only be used once.",
      "<strong style=\"color:#1c1917;\">Security note:</strong> If you did not request a password reset, you can safely ignore this email.",
    ],
    textBody: [
      "Reset your Caisty password",
      "",
      "We received a request to reset the password for your Caisty account.",
      "",
      "Open this link to choose a new password:",
      resetLink,
      "",
      "This link is valid for 1 hour and can only be used once.",
      "",
      "Security note: If you did not request a password reset, you can safely ignore this email.",
    ],
  });
}

/**
 * Sends a password-reset email for portal customers.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  const { subject, html, text } = buildPasswordResetEmail(resetLink);

  await sendEmail({
    to: email,
    subject,
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
