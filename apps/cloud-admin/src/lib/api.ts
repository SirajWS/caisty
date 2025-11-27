// apps/cloud-admin/src/lib/api.ts
const API_BASE = "/api";
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

// generische Listen-Antwort (z.B. für /customers, /subscriptions, …)
export type ListResponse<T> = {
  items: T[];
  total: number;
  limit?: number;
  offset?: number;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    throw new Error("Nicht autorisiert (401)");
  }

  if (!res.ok) {
    let message = `Request to ${path} failed with status ${res.status}`;
    try {
      const data = (await res.json()) as ApiErrorShape;
      if (data.error || data.message) {
        message = data.error || data.message || message;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  return request<TRes>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Notifications (Admin)
// ---------------------------------------------------------------------------

// Shape passend zu unserem Backend-Store für Admin-Notifications
export interface AdminNotification {
  id: string;
  kind?: string;          // z.B. "portal_support_message"
  source?: string;        // z.B. "portal"
  subject?: string;
  title: string;
  message?: string;
  description?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
  isRead?: boolean;       // aktuell nur Client-seitig
  data?: any;             // z.B. { supportMessageId: "..." }
}

// Support-Message-Shape für Admin
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

// Liste Notifications (für Glocke & Seite)
export function fetchNotifications(params?: {
  limit?: number;
  onlyUnread?: boolean;
}): Promise<ListResponse<AdminNotification>> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.onlyUnread) search.set("onlyUnread", "1");
  const qs = search.toString();

  // Backend-Route: /admin/notifications
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

// Support-Message Details laden
export function fetchSupportMessage(id: string): Promise<AdminSupportMessage> {
  return apiGet<AdminSupportMessage>(`/admin/support-messages/${id}`);
}

// Support-Message beantworten
export function replySupportMessage(
  id: string,
  body: { replyText: string; status?: string },
): Promise<AdminSupportMessage> {
  return apiPost<typeof body, AdminSupportMessage>(
    `/admin/support-messages/${id}/reply`,
    body,
  );
}

// "als gelesen" ist aktuell nur Client-seitig
export function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  return Promise.resolve({ ok: true });
}

// alte Helper bleiben erhalten (falls irgendwo verwendet)

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
