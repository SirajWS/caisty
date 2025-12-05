import {
    createContext,
    useContext,
    useEffect,
    useState,
  } from "react";
import type { ReactNode } from "react";
  
  const TOKEN_KEY = "caisty.admin.token";
  const USER_KEY = "caisty.admin.user";
  
  export type AuthUser = {
    id: string;
    email: string;
    name: string;
    role: "superadmin" | "admin" | "support";
  };
  
  type AuthContextValue = {
    user: AuthUser | null;
    token: string | null;
    setAuth: (token: string, user: AuthUser) => void;
    clearAuth: () => void;
  };
  
  const AuthContext = createContext<AuthContextValue | undefined>(undefined);
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
  
    // Beim Start: aus localStorage laden
    useEffect(() => {
      if (typeof window === "undefined") return;
  
      try {
        const storedToken = window.localStorage.getItem(TOKEN_KEY);
        const storedUser = window.localStorage.getItem(USER_KEY);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
      }
    }, []);
  
    const setAuth = (newToken: string, newUser: AuthUser) => {
      setToken(newToken);
      setUser(newUser);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_KEY, newToken);
        window.localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      }
    };
  
    const clearAuth = () => {
      setToken(null);
      setUser(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
      }
    };
  
    return (
      <AuthContext.Provider value={{ user, token, setAuth, clearAuth }}>
        {children}
      </AuthContext.Provider>
    );
  }
  
  export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
      throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
  }
  