// apps/cloud-api/src/config/env.ts
import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT) || 3333,
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  // Admin-Frontend Basis-URL (für Links in E-Mails)
  ADMIN_BASE_URL: process.env.ADMIN_BASE_URL ?? "http://localhost:5173",
  // Google OAuth (optional - nur wenn Google Login aktiviert werden soll)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3333/portal/auth/google/callback",
  PORTAL_BASE_URL: process.env.PORTAL_BASE_URL ?? "http://localhost:5175",
  // SMTP / E-Mail-Konfiguration (Zoho Mail)
  SMTP_HOST: process.env.SMTP_HOST ?? "smtp.zoho.eu",
  SMTP_PORT: process.env.SMTP_PORT ?? "587",
  SMTP_USER: process.env.SMTP_USER ?? "", // z.B. admin@caisty.com (für SMTP-Login)
  SMTP_PASSWORD: process.env.SMTP_PASSWORD ?? "", // Zoho App-Passwort
  SMTP_FROM: process.env.SMTP_FROM ?? "Caisty Support <support@caisty.com>", // Absender (kann "Name <email>" Format haben)
};

// Alias – sodass sowohl env als auch ENV funktioniert
export const env = ENV;
