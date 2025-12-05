// apps/cloud-api/src/routes/test-reset-token.ts
// Debug-Endpoint für Reset-Token (nur in Development)
import type { FastifyInstance } from "fastify";
import { ENV } from "../config/env.js";
import { db } from "../db/client.js";
import { adminPasswordResets, passwordResets } from "../db/schema/index.js";
import { eq, and, sql, isNull } from "drizzle-orm";
import crypto from "node:crypto";
import { customers } from "../db/schema/customers.js";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function registerTestResetTokenRoutes(app: FastifyInstance) {
  // GET /test-reset-token?token=... - Prüft Admin-Reset-Token
  app.get("/test-reset-token", async (request, reply) => {
    if (ENV.NODE_ENV !== "development") {
      reply.code(403);
      return { error: "Test-Endpoint nur in Development verfügbar" };
    }

    const query = request.query as { token?: string; type?: "admin" | "portal" };
    const token = query.token?.trim() || "";
    const type = query.type || "admin";

    if (!token) {
      reply.code(400);
      return {
        error: "Token-Parameter fehlt",
        usage: "?token=DEIN_TOKEN&type=admin|portal",
      };
    }

    try {
      const tokenHash = hashToken(token);
      const now = new Date();

      if (type === "admin") {
        // Admin-Reset-Token prüfen
        const [resetEntry] = await db
          .select({
            id: adminPasswordResets.id,
            adminUserId: adminPasswordResets.adminUserId,
            tokenHash: adminPasswordResets.tokenHash,
            expiresAt: adminPasswordResets.expiresAt,
            usedAt: adminPasswordResets.usedAt,
            createdAt: adminPasswordResets.createdAt,
          })
          .from(adminPasswordResets)
          .where(eq(adminPasswordResets.tokenHash, tokenHash))
          .limit(1);

        if (!resetEntry) {
          return {
            ok: false,
            error: "Token nicht in Datenbank gefunden",
            debug: {
              tokenHash,
              searchedHash: tokenHash,
              type: "admin",
            },
          };
        }

        const isExpired = resetEntry.expiresAt.getTime() < now.getTime();
        const isUsed = resetEntry.usedAt !== null;

        return {
          ok: true,
          found: true,
          token: {
            id: resetEntry.id,
            adminUserId: resetEntry.adminUserId,
            expiresAt: resetEntry.expiresAt.toISOString(),
            usedAt: resetEntry.usedAt?.toISOString() || null,
            createdAt: resetEntry.createdAt.toISOString(),
          },
          status: {
            isValid: !isExpired && !isUsed,
            isExpired,
            isUsed,
            expiresIn: isExpired
              ? "abgelaufen"
              : `${Math.round((resetEntry.expiresAt.getTime() - now.getTime()) / 1000 / 60)} Minuten`,
          },
          debug: {
            tokenHash,
            now: now.toISOString(),
            expiresAt: resetEntry.expiresAt.toISOString(),
            timeUntilExpiry: resetEntry.expiresAt.getTime() - now.getTime(),
          },
        };
      } else {
        // Portal-Reset-Token prüfen
        const [resetRecord] = await db
          .select({
            id: passwordResets.id,
            customerId: passwordResets.customerId,
            tokenHash: passwordResets.tokenHash,
            expiresAt: passwordResets.expiresAt,
            usedAt: passwordResets.usedAt,
            createdAt: passwordResets.createdAt,
            customerEmail: customers.email,
            customerName: customers.name,
          })
          .from(passwordResets)
          .innerJoin(customers, eq(customers.id, passwordResets.customerId))
          .where(eq(passwordResets.tokenHash, tokenHash))
          .limit(1);

        if (!resetRecord) {
          return {
            ok: false,
            error: "Token nicht in Datenbank gefunden",
            debug: {
              tokenHash,
              searchedHash: tokenHash,
              type: "portal",
            },
          };
        }

        const isExpired = resetRecord.expiresAt.getTime() < now.getTime();
        const isUsed = resetRecord.usedAt !== null;

        return {
          ok: true,
          found: true,
          token: {
            id: resetRecord.id,
            customerId: resetRecord.customerId,
            customerEmail: resetRecord.customerEmail,
            customerName: resetRecord.customerName,
            expiresAt: resetRecord.expiresAt.toISOString(),
            usedAt: resetRecord.usedAt?.toISOString() || null,
            createdAt: resetRecord.createdAt.toISOString(),
          },
          status: {
            isValid: !isExpired && !isUsed,
            isExpired,
            isUsed,
            expiresIn: isExpired
              ? "abgelaufen"
              : `${Math.round((resetRecord.expiresAt.getTime() - now.getTime()) / 1000 / 60)} Minuten`,
          },
          debug: {
            tokenHash,
            now: now.toISOString(),
            expiresAt: resetRecord.expiresAt.toISOString(),
            timeUntilExpiry: resetRecord.expiresAt.getTime() - now.getTime(),
          },
        };
      }
    } catch (error: any) {
      reply.code(500);
      return {
        ok: false,
        error: "Fehler beim Prüfen des Tokens",
        details: error.message,
        stack: ENV.NODE_ENV === "development" ? error.stack : undefined,
      };
    }
  });
}

