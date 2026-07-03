import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { adminLogin } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import type { AuthUser } from "../auth/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui";
import { CaistyLogo } from "../components/CaistyLogo";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = (await adminLogin(email, password)) as LoginResponse;

      if (!res.token || !res.user) {
        setError(res.error || "Login failed");
        return;
      }

      setAuth(res.token, res.user);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <CaistyLogo className="login-logo-svg" />
          <div className="login-brand-wordmark">
            <span className="login-brand-main">Caisty</span>
            <span className="login-brand-sub">Admin</span>
          </div>
          <p className="login-subtitle">Sign in with your admin account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="ds-form-field">
            Email
            <input
              type="email"
              className="ds-input login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="ds-form-field">
            Password
            <div className="login-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="ds-input login-input login-input--password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={18} aria-hidden />
                ) : (
                  <Eye size={18} aria-hidden />
                )}
              </button>
            </div>
          </label>

          {error ? <div className="login-error">{error}</div> : null}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Link to="/forgot-password" className="login-link">
              Forgot password?
            </Link>

            {import.meta.env.DEV ? (
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setEmail("siraj@caisty.com");
                  setPassword("CaistyAdmin123!");
                }}
                style={{ fontSize: 11, padding: "4px 8px" }}
              >
                Demo credentials
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
