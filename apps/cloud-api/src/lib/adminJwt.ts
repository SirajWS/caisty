// apps/cloud-api/src/lib/adminJwt.ts
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AdminRole = "superadmin" | "admin" | "support";

export interface AdminJwtPayload {
  adminUserId: string;
  email: string;
  role: AdminRole;
}

const EXPIRES_IN = "7d";

// Separate JWT Secret für Admin (kann auch derselbe sein, aber besser getrennt)
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || env.JWT_SECRET;

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  return jwt.verify(token, ADMIN_JWT_SECRET) as AdminJwtPayload;
}

