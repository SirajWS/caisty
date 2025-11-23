// apps/caisty-site/src/lib/authStorage.ts

const PORTAL_TOKEN_KEY = "caisty_portal_token";

/**
 * Holt den aktuellen Portal-Token aus localStorage.
 */
export function getPortalToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PORTAL_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Speichert den Portal-Token im localStorage.
 */
export function setPortalToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PORTAL_TOKEN_KEY, token);
  } catch {
    // Ignorieren (z.B. wenn Storage deaktiviert ist)
  }
}

/**
 * Löscht den Portal-Token (Logout).
 */
export function clearPortalToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PORTAL_TOKEN_KEY);
  } catch {
    // Ignorieren
  }
}
