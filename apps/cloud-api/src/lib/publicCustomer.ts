export type PublicCustomer = {
  id: string;
  orgId: string | null;
  name: string;
  email: string;
  status: string;
  portalStatus: string;
  profile: unknown;
  stripeCustomerId: string | null;
  emailVerifiedAt: string | Date | null;
  createdAt: string | Date;
};

const SECRET_CUSTOMER_KEYS = [
  "passwordHash",
  "password_hash",
] as const;

export function toPublicCustomer(row: Record<string, unknown>): PublicCustomer {
  const out: PublicCustomer = {
    id: String(row.id ?? ""),
    orgId: row.orgId == null ? null : String(row.orgId),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    status: String(row.status ?? "active"),
    portalStatus: String(row.portalStatus ?? "active"),
    profile: row.profile ?? {},
    stripeCustomerId:
      row.stripeCustomerId == null ? null : String(row.stripeCustomerId),
    emailVerifiedAt: (row.emailVerifiedAt as string | Date | null) ?? null,
    createdAt: (row.createdAt as string | Date) ?? new Date(0),
  };
  return out;
}

export function assertNoCustomerSecrets(payload: unknown): void {
  const json = JSON.stringify(payload);
  for (const key of SECRET_CUSTOMER_KEYS) {
    if (json.includes(`"${key}"`)) {
      throw new Error(`Customer payload must not include ${key}`);
    }
  }
}
