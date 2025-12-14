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
  ADMIN_BASE_URL: process.env.ADMIN_BASE_URL ?? 
    (process.env.NODE_ENV === "production"
      ? "https://admin.caisty.com"
      : "http://localhost:5175"),
  // Google OAuth (optional - nur wenn Google Login aktiviert werden soll)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI ?? 
    (process.env.NODE_ENV === "production" 
      ? "https://api.caisty.com/portal/auth/google/callback"
      : "http://localhost:3333/portal/auth/google/callback"),
  PORTAL_BASE_URL: (() => {
    // FORCE: Wenn ENV auf Admin-Port zeigt, überschreibe es IMMER
    const envUrl = process.env.PORTAL_BASE_URL;
    
    // HARD FIX: Immer auf 5173 setzen, wenn es 5175 oder admin enthält
    if (envUrl && (envUrl.includes("5175") || envUrl.includes("admin"))) {
      console.error("❌ ERROR: PORTAL_BASE_URL in .env zeigt auf Admin-Port!");
      console.error("   Aktueller Wert:", envUrl);
      console.error("   FORCE: Setze auf http://localhost:5173");
      console.error("   Bitte ändere PORTAL_BASE_URL in .env zu: http://localhost:5173");
      // IMMER überschreiben, damit es funktioniert
      return "http://localhost:5173";
    }
    
    // Default: 5173 für Development
    const url = envUrl ?? 
      (process.env.NODE_ENV === "production"
        ? "https://www.caisty.com"
        : "http://localhost:5173");
    
    // Zusätzliche Sicherheit: Prüfe nochmal das Ergebnis
    if (url.includes("5175") || url.includes("admin")) {
      console.error("❌ WARNUNG: PORTAL_BASE_URL enthält immer noch 5175/admin!");
      console.error("   Force-Setze auf http://localhost:5173");
      return "http://localhost:5173";
    }
    
    return url;
  })(),
  // SMTP / E-Mail-Konfiguration (Zoho Mail)
  SMTP_HOST: process.env.SMTP_HOST ?? "smtp.zoho.eu",
  SMTP_PORT: process.env.SMTP_PORT ?? "587",
  SMTP_USER: process.env.SMTP_USER ?? "", // z.B. admin@caisty.com (für SMTP-Login)
  SMTP_PASSWORD: process.env.SMTP_PASSWORD ?? "", // Zoho App-Passwort
  SMTP_FROM: process.env.SMTP_FROM ?? "Caisty Support <support@caisty.com>", // Absender (kann "Name <email>" Format haben)
  // Stripe Configuration
  STRIPE_ENV: process.env.STRIPE_ENV ?? "test",
  STRIPE_SECRET_KEY_TEST: process.env.STRIPE_SECRET_KEY_TEST ?? "",
  STRIPE_SECRET_KEY_LIVE: process.env.STRIPE_SECRET_KEY_LIVE ?? "",
  STRIPE_WEBHOOK_SECRET_TEST: process.env.STRIPE_WEBHOOK_SECRET_TEST ?? "",
  STRIPE_WEBHOOK_SECRET_LIVE: process.env.STRIPE_WEBHOOK_SECRET_LIVE ?? "",
};

// Alias – sodass sowohl env als auch ENV funktioniert
export const env = ENV;
