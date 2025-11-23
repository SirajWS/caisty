// apps/cloud-api/src/lib/portalJwt.ts
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface PortalJwtPayload {
  customerId: string;
  orgId: string;
}

const EXPIRES_IN = "30d";

export function signPortalToken(payload: PortalJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyPortalToken(token: string): PortalJwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as PortalJwtPayload;
}
