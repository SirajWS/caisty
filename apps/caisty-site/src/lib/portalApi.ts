// apps/caisty-site/src/lib/portalApi.ts

const API_BASE =
  import.meta.env.VITE_CLOUD_API_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3333";

const PORTAL_TOKEN_KEY = "caisty.portal.token";

export type PortalStatus = "active" | "pending" | "blocked";
export type LicenseStatus = "active" | "revoked" | "expired";

// kleine Zusammenfassung für Konto-Seite
export interface PortalPrimaryLicenseSummary {
  id: string;
  key: string;
  plan: string;
  status: LicenseStatus | string;
  validUntil: string | null;
}

export interface PortalCustomer {
  id: string;
  orgId: string;
  name: string;
  email: string;
  portalStatus: PortalStatus;
  // nur bei /portal/me befüllt
  primaryLicense?: PortalPrimaryLicenseSummary | null;
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

// Konto-Update
export async function updatePortalAccount(input: {
  name?: string;
  email?: string;
}): Promise<PortalCustomer> {
  const token = getStoredPortalToken();
  if (!token) throw new Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/account`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as {
    ok: boolean;
    customer?: PortalCustomer;
    message?: string;
  };

  if (!res.ok || !data.ok || !data.customer) {
    throw new Error(
      data.message ?? "Konto konnte nicht aktualisiert werden.",
    );
  }

  return data.customer;
}

// Passwort ändern
export async function changePortalPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const token = getStoredPortalToken();
  if (!token) throw new Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as { ok: boolean; message?: string };

  if (!res.ok || !data.ok) {
    throw new Error(
      data.message ?? "Passwort konnte nicht geändert werden.",
    );
  }
}

// ---------- Datentypen für Portal-Listen ----------

export interface PortalLicense {
  id: string;
  key: string;
  plan: string; // "trial" | "starter" | "pro"
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
  status: "open" | "paid" | "failed" | string;
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

// ---------- Trial-Lizenz einmalig anlegen ----------

export async function createTrialLicense(): Promise<PortalLicense> {
  const token = getStoredPortalToken();
  if (!token) {
    throw new Error("Nicht angemeldet.");
  }

  const res = await fetch(`${API_BASE}/portal/trial-license`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const data = (await res.json()) as {
    ok: boolean;
    license?: PortalLicense;
    message?: string;
    reason?: string;
  };

  if (!res.ok || !data.ok || !data.license) {
    if (
      data.reason === "already_had_trial" ||
      data.reason === "trial_already_used"
    ) {
      throw new Error(
        data.message ??
          "Für dieses Konto wurde bereits eine Testlizenz angelegt.",
      );
    }

    if (data.reason === "active_plan_exists") {
      throw new Error(
        data.message ??
          "Für dieses Konto existiert bereits ein aktiver, bezahlter Plan.",
      );
    }

    throw new Error(
      data.message ?? "Testlizenz konnte nicht erstellt werden.",
    );
  }

  return data.license;
}

// ---------- Upgrade (Starter/Pro) ----------

export type PortalUpgradeStartResponse = {
  ok: boolean;
  message?: string;
  reason?: string;
  subscription?: {
    id: string;
    plan: string;
    status: string;
  };
  invoice?: {
    id: string;
    number: string;
    amount: number;
    currency: string;
    status: string;
    issuedAt: string;
    dueAt: string;
  };
  redirectUrl?: string;
  paypalOrderId?: string;
};

export async function startPortalUpgrade(
  plan: "starter" | "pro",
): Promise<PortalUpgradeStartResponse> {
  const token = getStoredPortalToken();
  if (!token) throw new Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/upgrade/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan }),
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const data = (await res.json()) as PortalUpgradeStartResponse;

  if (!res.ok || !data.ok) {
    throw new Error(
      data.message ?? "Upgrade konnte nicht gestartet werden.",
    );
  }

  return data;
}

// ---------- Support / Kontakt aus Portal ----------

export interface PortalSupportMessage {
  id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed" | string;
  createdAt: string; // ISO
  replyText?: string | null;
  repliedAt?: string | null;
}

export async function createPortalSupportMessage(input: {
  subject: string;
  message: string;
}): Promise<PortalSupportMessage> {
  const token = getStoredPortalToken();
  if (!token) throw new Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/support-messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const ct = res.headers.get("content-type") ?? "";
  let data: any = {};
  if (ct.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok || (!data.ok && !data.message && !data.item)) {
    throw new Error(
      data.message ||
        data.error ||
        "Nachricht konnte nicht gesendet werden.",
    );
  }

  const msg: PortalSupportMessage = data.message || data.item;
  return msg;
}

export async function fetchPortalSupportMessages(): Promise<
  PortalSupportMessage[]
> {
  const token = getStoredPortalToken();
  if (!token) throw new Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/portal/support-messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const ct = res.headers.get("content-type") ?? "";
  let data: any = {};
  if (ct.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) {
    throw new Error(
      data.message ||
        data.error ||
        "Support-Anfragen konnten nicht geladen werden.",
    );
  }

  if (Array.isArray(data)) {
    return data as PortalSupportMessage[];
  }

  return (data.items || data.messages || []) as PortalSupportMessage[];
}
