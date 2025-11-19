import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";
import { useAuth, AuthUser } from "../auth/AuthContext";

type LoginResponse = {
  token: string;
  user: AuthUser;
};

export default function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("admin@caisty.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiPost<{ email: string; password: string }, LoginResponse>(
        "/auth/login",
        { email, password },
      );

      setAuth(res.token, res.user);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)",
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(15, 23, 42, 0.9)",
          border: "1px solid rgba(51, 65, 85, 0.5)",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(10px)"
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#f1f5f9",
            marginBottom: "8px",
            textAlign: "center"
          }}
        >
          Caisty Cloud – Admin Login
        </h1>
        
        <p
          style={{
            fontSize: "14px",
            color: "#94a3b8",
            marginBottom: "32px",
            textAlign: "center"
          }}
        >
          Melde dich mit deinem Admin-Account an, um Caisty Cloud zu verwalten.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                color: "#cbd5e1",
                marginBottom: "8px",
                fontWeight: 500
              }}
            >
              E-Mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f1f5f9",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#10b981";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#334155";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                color: "#cbd5e1",
                marginBottom: "8px",
                fontWeight: 500
              }}
            >
              Passwort
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f1f5f9",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#10b981";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#334155";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                color: "#fca5a5",
                fontSize: "14px"
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 24px",
              background: loading ? "#059669" : "#10b981",
              color: "#020617",
              fontSize: "16px",
              fontWeight: 600,
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#059669";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#10b981";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {loading ? "Einloggen..." : "Einloggen"}
          </button>

          <p
            style={{
              fontSize: "12px",
              color: "#64748b",
              textAlign: "center",
              marginTop: "8px"
            }}
          >
            Demo:{" "}
            <code
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "11px",
                color: "#cbd5e1"
              }}
            >
              admin@caisty.local
            </code>{" "}
            /{" "}
            <code
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "11px",
                color: "#cbd5e1"
              }}
            >
              admin123
            </code>
          </p>
        </form>
      </div>
    </div>
  );
}