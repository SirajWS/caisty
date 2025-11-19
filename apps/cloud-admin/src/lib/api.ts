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
    // Optional: Token löschen oder Redirect zur Login-Seite
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
