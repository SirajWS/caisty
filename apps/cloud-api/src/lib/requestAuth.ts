import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import {
  type AdminJwtPayload,
  type AdminRole,
  verifyAdminToken,
} from "./adminJwt.js";

export type RequestAuthUser =
  | (AdminJwtPayload & { kind: "admin"; isAdmin: true })
  | {
      kind: "portal";
      customerId: string;
      orgId: string;
      isAdmin: false;
    }
  | {
      kind: "user";
      userId: string;
      orgId: string;
      role: string;
      isAdmin: false;
    };

export function authenticateBearer(token: string): RequestAuthUser {
  try {
    const admin = verifyAdminToken(token);
    return {
      kind: "admin",
      adminUserId: admin.adminUserId,
      email: admin.email,
      role: admin.role as AdminRole,
      isAdmin: true,
    };
  } catch {
    // Portal and legacy user JWTs share JWT_SECRET; never treat them as admin.
  }

  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }

  const customerId =
    typeof decoded.customerId === "string" ? decoded.customerId : "";
  const orgId = typeof decoded.orgId === "string" ? decoded.orgId : "";
  const userId = typeof decoded.userId === "string" ? decoded.userId : "";

  if (customerId && orgId && !decoded.adminUserId) {
    return {
      kind: "portal",
      customerId,
      orgId,
      isAdmin: false,
    };
  }

  if (userId && orgId && !decoded.adminUserId) {
    return {
      kind: "user",
      userId,
      orgId,
      role: typeof decoded.role === "string" ? decoded.role : "",
      isAdmin: false,
    };
  }

  throw new Error("Invalid or expired token");
}
