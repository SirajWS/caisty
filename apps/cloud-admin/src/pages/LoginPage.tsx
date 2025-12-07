import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
// ⬇️ statt apiPost direkt den speziellen Helper nutzen
import { adminLogin } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import type { AuthUser } from "../auth/AuthContext";
import { useTheme, themeColors } from "../theme/ThemeContext";

type LoginResponse = {
  token: string;
  user: AuthUser;
  ok?: boolean;
  error?: string;
};

export default function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const colors = themeColors[theme];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // ⬇️ POST auf https://api.caisty.com/admin/auth/login (prod)
      const res = (await adminLogin(email, password)) as LoginResponse;

      if (!res.token || !res.user) {
        setError(res.error || "Login fehlgeschlagen");
        return;
      }

      setAuth(res.token, res.user);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  const bgGradient =
    theme === "dark"
      ? "linear-gradient(135deg, #0f172a 0%, #020617 100%)"
      : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bgGradient,
        padding: "20px",
        transition: "background 0.3s",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: colors.card,
          border: `1px solid ${colors.borderSecondary}`,
          borderRadius: "16px",
          padding: "40px",
          boxShadow:
            theme === "dark"
              ? "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
              : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(10px)",
          transition: "background-color 0.3s, border-color 0.3s",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: colors.text,
              marginBottom: "8px",
              letterSpacing: "-0.5px",
            }}
          >
            Caisty <span style={{ color: colors.accent }}>Admin</span>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: colors.textSecondary,
              marginTop: "8px",
            }}
          >
            Melde dich mit deinem Admin-Account an
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                color: colors.textSecondary,
                marginBottom: "8px",
                fontWeight: 500,
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
                background: colors.input,
                border: `1px solid ${colors.borderSecondary}`,
                borderRadius: "8px",
                color: colors.text,
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.accent;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accent}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.borderSecondary;
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
                fontWeight: 500,
              }}
            >
              Passwort
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  paddingRight: "44px",
                  background: colors.input,
                  border: `1px solid ${colors.borderSecondary}`,
                  borderRadius: "8px",
                  color: colors.text,
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.accent;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accent}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.borderSecondary;
                  e.currentTarget.style.boxShadow = "none";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "14px",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                background: colors.errorBg,
                border: `1px solid ${colors.error}50`,
                borderRadius: "8px",
                color: colors.error,
                fontSize: "14px",
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
              background: loading ? colors.accentHover : colors.button,
              color: theme === "dark" ? "#020617" : "#ffffff",
              fontSize: "16px",
              fontWeight: 600,
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = colors.accentHover;
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${colors.accent}50`;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = colors.button;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {loading ? "Einloggen..." : "Einloggen"}
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "8px",
            }}
          >
            <Link
              to="/forgot-password"
              style={{
                fontSize: "12px",
                color: colors.accent,
                textDecoration: "none",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.accentHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.accent;
              }}
            >
              Passwort vergessen?
            </Link>

            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => {
                  setEmail("siraj@caisty.com");
                  setPassword("CaistyAdmin123!");
                }}
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  background: "transparent",
                  border: "1px solid #334155",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#475569";
                  e.currentTarget.style.color = "#94a3b8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#334155";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                Demo-Credentials
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
