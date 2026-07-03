// apps/cloud-admin/src/pages/ResetPasswordPage.tsx
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiPost } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

type ResetPasswordResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};

function LoginBrand({ subtitle }: { subtitle: string }) {
  return (
    <div className="login-brand">
      <div className="login-brand-row">
        <div className="admin-logo-mark" aria-hidden>
          C
        </div>
        <div className="login-brand-wordmark">
          <span className="login-brand-main">Caisty</span>
          <span className="login-brand-sub">Admin</span>
        </div>
      </div>
      <p className="login-subtitle">{subtitle}</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuth();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid reset link.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiPost<
        { token: string; newPassword: string },
        ResetPasswordResponse
      >("/admin/auth/reset-password", {
        token,
        newPassword,
      });

      if (!res.ok) {
        setError(res.error || "Failed to reset password.");
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 className="login-title">Password reset</h1>
          <p className="login-subtitle">
            Your password was reset successfully. Redirecting to sign in…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <LoginBrand subtitle="Set a new password" />

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="ds-form-field">
            New password
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                className="ds-input login-input"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink2)",
                  fontSize: 14,
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <label className="ds-form-field">
            Confirm password
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                className="ds-input login-input"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink2)",
                  fontSize: 14,
                }}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error ? <div className="login-error">{error}</div> : null}

          <button
            type="submit"
            className="login-button"
            disabled={loading || !token}
          >
            {loading ? "Resetting…" : "Reset password"}
          </button>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Link to="/login" className="login-link">
              ← Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
