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

export function isAdminJwtPayload(value: unknown): value is AdminJwtPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.adminUserId !== "string" || !v.adminUserId.trim()) return false;
  if (typeof v.email !== "string" || !v.email.trim()) return false;
  if (v.role !== "superadmin" && v.role !== "admin" && v.role !== "support") {
    return false;
  }
  return true;
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
  if (!isAdminJwtPayload(decoded)) {
    throw new Error("Invalid admin token payload");
  }
  return decoded;
}

