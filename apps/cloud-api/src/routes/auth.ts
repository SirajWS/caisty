// apps-cloud-api/src/routes/auth.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { users } from "../db/schema/users";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../lib/passwords";
import { signToken } from "../lib/jwt";

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const body = request.body as { email?: string; password?: string };

    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;

    if (!email || !password) {
      return reply.code(400).send({ error: "Email and password are required" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const token = signToken({
      userId: user.id,
      orgId: user.orgId,
      role: user.role as "owner" | "admin",
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  });
}
