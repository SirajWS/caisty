// apps/caisty-site/src/lib/portalApi.ts
const API_BASE =
  import.meta.env.VITE_CLOUD_API_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3333";

const PORTAL_TOKEN_KEY = "caisty.portal.token";

export type PortalStatus = "active" | "pending" | "blocked";

export interface PortalCustomer {
  id: string;
  orgId: string;
  name: string;
  email: string;
  portalStatus: PortalStatus;
}

interface AuthResponse {
  ok: boolean;
  token: string;
  customer: PortalCustomer;
  message?: string;
}

// ---------- Token-Storage ----------

export function getStoredPortalToken(): string | null {
  try {
    return localStorage.getItem(PORTAL_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storePortalToken(token: string) {
  try {
    localStorage.setItem(PORTAL_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearPortalToken() {
  try {
    localStorage.removeItem(PORTAL_TOKEN_KEY);
  } catch {
    // ignore
  }
}

// ---------- Auth ----------

export async function portalRegister(input: {
  name: string;
  email: string;
  password: string;
}): Promise<PortalCustomer> {
  const res = await fetch(`${API_BASE}/portal/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as AuthResponse;

  if (!res.ok || !data.ok) {
    throw new Error(data.message ?? "Registrierung fehlgeschlagen.");
  }

  storePortalToken(data.token);
  return data.customer;
}

export async function portalLogin(input: {
  email: string;
  password: string;
}): Promise<PortalCustomer> {
  const res = await fetch(`${API_BASE}/portal/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as AuthResponse;

  if (!res.ok || !data.ok) {
    throw new Error(data.message ?? "Login fehlgeschlagen.");
  }

  storePortalToken(data.token);
  return data.customer;
}

export async function fetchPortalMe(): Promise<PortalCustomer | null> {
  const token = getStoredPortalToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/portal/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearPortalToken();
    return null;
  }

  if (!res.ok) {
    throw new Error("Konnte Kundendaten nicht laden.");
  }

  const data = (await res.json()) as {
    ok: boolean;
    customer?: PortalCustomer;
  };

  if (!data.ok || !data.customer) return null;
  return data.customer;
}

// ---------- Datentypen für Portal-Listen ----------

export type LicenseStatus = "active" | "revoked" | "expired";

export interface PortalLicense {
  id: string;
  key: string;
  plan: string; // "starter" | "pro"
  status: LicenseStatus | string;
  maxDevices: number;
  validUntil: string | null; // ISO
  createdAt: string; // ISO
}

export interface PortalDevice {
  id: string;
  name: string;
  deviceId: string;
  lastSeenAt: string | null; // ISO oder null
  status: "online" | "offline" | "never_seen" | string;
  licenseKey: string | null;
}

export interface PortalInvoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: "open" | "paid" | "overdue" | "failed" | string;
  periodFrom: string | null; // ISO
  periodTo: string | null; // ISO
  createdAt: string; // ISO
}

// ---------- generischer GET-Helper ----------

async function authGet<T>(path: string): Promise<T> {
  const token = getStoredPortalToken();
  if (!token) {
    throw new Error("Kein Portal-Token vorhanden.");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  if (!res.ok) {
    throw new Error(`Fehler beim Laden von ${path}: ${res.status}`);
  }

  return (await res.json()) as T;
}

// ---------- Portal-Listen ----------

export async function fetchPortalLicenses(): Promise<PortalLicense[]> {
  return authGet<PortalLicense[]>("/portal/licenses");
}

export async function fetchPortalDevices(): Promise<PortalDevice[]> {
  return authGet<PortalDevice[]>("/portal/devices");
}

export async function fetchPortalInvoices(): Promise<PortalInvoice[]> {
  return authGet<PortalInvoice[]>("/portal/invoices");
}
