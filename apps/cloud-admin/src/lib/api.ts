// apps/cloud-admin/src/lib/api.ts

// Basis-URL für die API
// - Lokal: /api  (z.B. via Vite-Proxy)
// - Produktion: VITE_API_BASE_URL = https://api.caisty.com
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
// trailing Slashes am Ende wegnehmen, damit wir sauber `${API_BASE}/...` machen können
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const TOKEN_KEY = "caisty.admin.token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

type ApiErrorShape = { error?: string; message?: string };

export type ListResponse<T> = {
  items: T[];
  total: number;
  limit?: number;
  offset?: number;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // Nur Content-Type setzen, wenn es wirklich einen Body gibt
  if (options.body !== undefined && !("Content-Type" in headers)) {
    (headers as any)["Content-Type"] = "application/json";
  }

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  // Pfad immer an die Basis hängen
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Versuche Error-Message aus Response zu lesen
    try {
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const data = (await res.json()) as ApiErrorShape;
        throw new Error(data.error || data.message || "Nicht autorisiert (401)");
      }
    } catch (err) {
      if (err instanceof Error) throw err;
    }
    throw new Error("Nicht autorisiert (401)");
  }

  if (!res.ok) {
    let message = `Request to ${path} failed with status ${res.status}`;
    try {
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const data = (await res.json()) as ApiErrorShape;
        if (data.error || data.message) {
          message = data.error || data.message || message;
        }
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    // Wenn kein JSON zurückkommt, einfach undefined liefern
    return undefined as T;
  }

  return (await res.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<TReq, TRes>(
  path: string,
  body: TReq,
): Promise<TRes> {
  return request<TRes>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPatch<TReq, TRes>(
  path: string,
  body: TReq,
): Promise<TRes> {
  return request<TRes>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function apiDelete<T = any>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Admin Auth – 👉 diese Funktionen solltest du im Login-Formular benutzen
// ---------------------------------------------------------------------------

export type AdminLoginResponse = {
  token: string;
  // hier kannst du bei Bedarf noch user-Daten ergänzen
  // user: { id: string; email: string; role: string; ... }
};

export function adminLogin(
  email: string,
  password: string,
): Promise<AdminLoginResponse> {
  return apiPost<{ email: string; password: string }, AdminLoginResponse>(
    "/admin/auth/login",
    { email, password },
  );
}

export function adminMe<TRes = any>(): Promise<TRes> {
  return apiGet<TRes>("/admin/auth/me");
}

// ---------------------------------------------------------------------------
// Notifications (Admin) – unverändert
// ---------------------------------------------------------------------------

export interface AdminNotification {
  id: string;
  kind?: string;
  source?: string;
  subject?: string;
  title: string;
  message?: string;
  description?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
  isRead?: boolean;
  data?: any;
}

export interface AdminSupportMessage {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  replyText: string | null;
  repliedAt: string | null;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
}

export function fetchNotifications(params?: {
  limit?: number;
  onlyUnread?: boolean;
}): Promise<ListResponse<AdminNotification>> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.onlyUnread) search.set("onlyUnread", "1");
  const qs = search.toString();

  return apiGet<any>(`/admin/notifications${qs ? `?${qs}` : ""}`).then(
    (data) => {
      const items: AdminNotification[] = Array.isArray(data)
        ? data
        : (data.items as AdminNotification[]) ?? [];

      const total =
        typeof data.total === "number" ? data.total : items.length;

      return {
        items,
        total,
        limit: data.limit ?? params?.limit,
        offset: data.offset ?? 0,
      };
    },
  );
}

export function fetchSupportMessage(
  id: string,
): Promise<AdminSupportMessage> {
  return apiGet<AdminSupportMessage>(`/admin/support-messages/${id}`);
}

export function replySupportMessage(
  id: string,
  body: { replyText: string; status?: string },
): Promise<AdminSupportMessage> {
  return apiPost<typeof body, AdminSupportMessage>(
    `/admin/support-messages/${id}/reply`,
    body,
  );
}

// Aktuell noch Dummy – solange es im Backend keinen Endpoint gibt
export function markNotificationRead(
  id: string,
): Promise<{ ok: boolean }> {
  return Promise.resolve({ ok: true });
}

export function apiGetNotifications(): Promise<
  ListResponse<AdminNotification>
> {
  return fetchNotifications();
}

export function apiMarkNotificationRead(
  id: string,
): Promise<{ item: AdminNotification }> {
  return markNotificationRead(id).then(() => ({
    item: { id } as AdminNotification,
  }));
}
