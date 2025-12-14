// apps/cloud-api/src/routes/portal-google-auth.ts
import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { orgs } from "../db/schema/orgs.js";
import { customerAuthProviders } from "../db/schema/customerAuthProviders.js";
import { signPortalToken } from "../lib/portalJwt.js";
import { ENV } from "../config/env.js";

// Helper: Slug aus Name generieren
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

const GOOGLE_CLIENT_ID = ENV.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = ENV.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = ENV.GOOGLE_REDIRECT_URI;
// FORCE: Stelle sicher, dass PORTAL_BASE_URL auf 5173 zeigt (nicht 5175)
// HARD FIX: In Development IMMER 5173 verwenden
const PORTAL_BASE_URL = (() => {
  // In Development: IMMER 5173 (Kundenportal), nie 5175 (Admin)
  if (process.env.NODE_ENV !== "production") {
    const hardcoded = "http://localhost:5173";
    const envUrl = ENV.PORTAL_BASE_URL;
    if (envUrl !== hardcoded) {
      console.error("❌ PORTAL_BASE_URL ist nicht 5173!");
      console.error("   ENV sagt:", envUrl);
      console.error("   FORCE: Verwende", hardcoded);
    }
    return hardcoded;
  }
  // Production: Verwende ENV-Wert
  const url = ENV.PORTAL_BASE_URL;
  if (url.includes("5175") || url.includes("admin")) {
    console.error("❌ CRITICAL: PORTAL_BASE_URL zeigt auf Admin-Port! Force-Setze auf 5173");
    return "http://localhost:5173";
  }
  return url;
})();

// Node-Fetch Alias
const nodeFetch: any = (globalThis as any).fetch;

/**
 * Google OAuth Token Exchange
 */
async function exchangeGoogleCode(code: string): Promise<{
  access_token: string;
  id_token?: string;
}> {
  const res = await nodeFetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }

  return (await res.json()) as { access_token: string; id_token?: string };
}

/**
 * Google User Info abrufen
 */
async function getGoogleUserInfo(accessToken: string): Promise<{
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}> {
  const res = await nodeFetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google userinfo failed: ${res.status} ${text}`);
  }

  return (await res.json()) as {
    sub: string;
    email: string;
    email_verified: boolean;
    name: string;
    picture?: string;
  };
}

export async function registerPortalGoogleAuthRoutes(app: FastifyInstance) {
  // GET /portal/auth/google - Redirect zu Google
  app.get("/portal/auth/google", async (request, reply) => {
    // Debug: Log ENV-Variablen (ohne Secrets zu loggen)
    app.log.info({
      hasClientId: !!GOOGLE_CLIENT_ID,
      clientIdLength: GOOGLE_CLIENT_ID.length,
      hasClientSecret: !!GOOGLE_CLIENT_SECRET,
      clientSecretLength: GOOGLE_CLIENT_SECRET.length,
      redirectUri: GOOGLE_REDIRECT_URI,
      portalBaseUrl: PORTAL_BASE_URL,
      envPortalBaseUrl: ENV.PORTAL_BASE_URL,
      nodeEnv: process.env.NODE_ENV,
    }, "Google OAuth config check");
    
    // Warnung, wenn PORTAL_BASE_URL auf Admin-Port zeigt
    if (PORTAL_BASE_URL.includes("5175") || PORTAL_BASE_URL.includes("admin")) {
      app.log.error({ portalBaseUrl: PORTAL_BASE_URL }, "❌ CRITICAL: PORTAL_BASE_URL zeigt auf Admin-Port! Sollte auf Port 5173 (Kundenportal) zeigen.");
    } else {
      app.log.info({ portalBaseUrl: PORTAL_BASE_URL }, "✅ PORTAL_BASE_URL ist korrekt (5173)");
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      app.log.warn({
        GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID || "MISSING",
        GOOGLE_CLIENT_SECRET: GOOGLE_CLIENT_SECRET ? "SET" : "MISSING",
      }, "Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
      reply.code(500);
      return { 
        error: "Google OAuth not configured",
        message: "Bitte setze GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET in der .env Datei. Siehe MIGRATION_GOOGLE_AUTH.md für Details.",
        hint: "Stelle sicher, dass die .env Datei in apps/cloud-api/.env liegt und der Server neu gestartet wurde."
      };
    }

    // State-Parameter aus Query lesen (register oder login)
    const query = request.query as { state?: string };
    const state = query.state || "login"; // Default: login

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state: state, // State an Google weitergeben (wird im Callback zurückgegeben)
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    reply.redirect(googleAuthUrl);
  });

  // GET /portal/auth/google/callback - Google Callback
  app.get("/portal/auth/google/callback", async (request, reply) => {
    const query = request.query as { code?: string; error?: string; state?: string };
    
    // State-Parameter aus Google-Callback lesen (register oder login)
    const state = query.state || "login"; // Default: login
    const redirectPage = state === "register" ? "register" : "login";

    if (query.error) {
      reply.redirect(`${PORTAL_BASE_URL}/${redirectPage}?error=google_auth_failed`);
      return;
    }

    if (!query.code) {
      reply.redirect(`${PORTAL_BASE_URL}/${redirectPage}?error=missing_code`);
      return;
    }

    try {
      // 1. Code gegen Access Token tauschen
      const tokenData = await exchangeGoogleCode(query.code);
      const accessToken = tokenData.access_token;

      // 2. User Info von Google abrufen
      const googleUser = await getGoogleUserInfo(accessToken);

      if (!googleUser.email_verified) {
        reply.redirect(`${PORTAL_BASE_URL}/${redirectPage}?error=email_not_verified`);
        return;
      }

      const email = googleUser.email.toLowerCase().trim();
      const providerUserId = googleUser.sub;

      // 3. Prüfe, ob Provider-Verknüpfung bereits existiert
      const [existingProvider] = await db
        .select({
          provider: customerAuthProviders.provider,
          customerId: customerAuthProviders.customerId,
          customer: customers,
        })
        .from(customerAuthProviders)
        .innerJoin(
          customers,
          eq(customers.id, customerAuthProviders.customerId)
        )
        .where(
          and(
            eq(customerAuthProviders.provider, "google"),
            eq(customerAuthProviders.providerUserId, providerUserId)
          )
        )
        .limit(1);

      if (existingProvider) {
        // Fall 1: Provider-Verknüpfung existiert → Login
        const customer = existingProvider.customer;
        const token = signPortalToken({
          customerId: customer.id,
          orgId: customer.orgId!,
        });

        // DEBUG: Log den Redirect-URL
        app.log.info({ redirectUrl: `${PORTAL_BASE_URL}/portal/login/success?token=...` }, "Redirecting to portal after login");
        reply.redirect(`${PORTAL_BASE_URL}/portal/login/success?token=${encodeURIComponent(token)}`);
        return;
      }

      // 4. Prüfe, ob Customer mit dieser E-Mail existiert
      const [existingCustomer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, email))
        .limit(1);

      if (existingCustomer) {
        // Fall 2: Customer existiert, aber keine Google-Verknüpfung → Verknüpfung hinzufügen
        // Prüfe zuerst, ob bereits eine Google-Verknüpfung für diesen Customer existiert
        const [existingGoogleProvider] = await db
          .select()
          .from(customerAuthProviders)
          .where(
            and(
              eq(customerAuthProviders.customerId, existingCustomer.id),
              eq(customerAuthProviders.provider, "google")
            )
          )
          .limit(1);

        if (!existingGoogleProvider) {
          // Keine Google-Verknüpfung → neue anlegen
          try {
            await db.insert(customerAuthProviders).values({
              customerId: existingCustomer.id,
              provider: "google",
              providerUserId: providerUserId,
              providerEmail: email,
              providerData: JSON.stringify({
                name: googleUser.name,
                picture: googleUser.picture,
              }),
            });
          } catch (insertErr: any) {
            // Falls der Insert fehlschlägt (z.B. unique constraint), prüfe nochmal
            if (insertErr.message.includes("duplicate key") || insertErr.message.includes("unique constraint")) {
              app.log.warn({ customerId: existingCustomer.id, providerUserId }, "Google provider link already exists, continuing with login");
            } else {
              throw insertErr;
            }
          }
        }

        const token = signPortalToken({
          customerId: existingCustomer.id,
          orgId: existingCustomer.orgId!,
        });

        // DEBUG: Log den Redirect-URL
        app.log.info({ redirectUrl: `${PORTAL_BASE_URL}/portal/login/success?token=...` }, "Redirecting to portal after linking Google");
        reply.redirect(`${PORTAL_BASE_URL}/portal/login/success?token=${encodeURIComponent(token)}`);
        return;
      }

      // Fall 3: Neuer Customer → Organisation + Customer + Provider-Verknüpfung anlegen
      const orgName = googleUser.name || email.split("@")[0];
      const slug = makeSlug(orgName);

      const [org] = await db
        .insert(orgs)
        .values({ name: orgName, slug })
        .returning();

      const [customer] = await db
        .insert(customers)
        .values({
          orgId: org.id,
          name: orgName,
          email: email,
          passwordHash: null, // Kein Passwort für Google-User
          portalStatus: "active",
        })
        .returning({
          id: customers.id,
          orgId: customers.orgId,
          name: customers.name,
          email: customers.email,
          portalStatus: customers.portalStatus,
        });

      // Provider-Verknüpfung anlegen
      await db.insert(customerAuthProviders).values({
        customerId: customer.id,
        provider: "google",
        providerUserId: providerUserId,
        providerEmail: email,
        providerData: JSON.stringify({
          name: googleUser.name,
          picture: googleUser.picture,
        }),
      });

      const token = signPortalToken({
        customerId: customer.id,
        orgId: customer.orgId!,
      });

      // DEBUG: Log den Redirect-URL
      app.log.info({ redirectUrl: `${PORTAL_BASE_URL}/portal/login/success?token=...` }, "Redirecting to portal after registration");
      reply.redirect(`${PORTAL_BASE_URL}/portal/login/success?token=${encodeURIComponent(token)}`);
    } catch (err) {
      // Detailliertes Error-Logging für Debugging
      const errorDetails = err instanceof Error ? {
        message: err.message,
        stack: err.stack,
        name: err.name,
      } : { error: String(err) };

      app.log.error({ 
        err: errorDetails,
        query: request.query,
      }, "Google OAuth callback error");

      // Spezifische Fehlermeldungen für häufige Probleme
      let errorParam = "oauth_error";
      if (err instanceof Error) {
        if (err.message.includes("relation") && err.message.includes("customer_auth_providers")) {
          errorParam = "db_migration_required";
          app.log.error("❌ Tabelle 'customer_auth_providers' fehlt! Führe die Migration aus: drizzle/007_add_customer_auth_providers.sql");
        } else if (err.message.includes("duplicate key") || err.message.includes("unique constraint")) {
          errorParam = "duplicate_provider";
        } else if (err.message.includes("foreign key") || err.message.includes("customer_id")) {
          errorParam = "invalid_customer";
        }
      }

      reply.redirect(`${PORTAL_BASE_URL}/${redirectPage}?error=${errorParam}`);
    }
  });
}

