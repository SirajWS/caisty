// apps/cloud-admin/src/pages/ForgotPasswordPage.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiPost } from "../lib/api";

type ForgotPasswordResponse = {
  ok: boolean;
  message?: string;
  error?: string;
  resetLink?: string;
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiPost<{ email: string }, ForgotPasswordResponse>(
        "/admin/auth/forgot-password",
        { email },
      );

      if (!res.ok) {
        setError(res.error || "Failed to request reset link.");
        return;
      }

      setSuccess(true);

      if (res.resetLink) {
        setResetLink(res.resetLink);
        console.log("Reset link received:", res.resetLink);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to request reset link.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 className="login-title">Email sent</h1>
          <p className="login-subtitle" style={{ marginBottom: 24 }}>
            If an account exists for this email, we sent a link to reset your
            password.
          </p>

          {resetLink && (
            <div
              style={{
                padding: 16,
                background: "var(--admin-accent-soft)",
                border: "1px solid color-mix(in srgb, var(--brand) 35%, transparent)",
                borderRadius: 8,
                marginBottom: 24,
                textAlign: "left",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "var(--brand)",
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                Development mode: reset link
              </p>
              <a href={resetLink} className="ds-link" style={{ fontSize: 12, wordBreak: "break-all" }}>
                {resetLink}
              </a>
            </div>
          )}

          <Link to="/login" className="login-link">
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <LoginBrand subtitle="Reset your password" />

        <p
          className="ds-muted"
          style={{ marginBottom: 24, textAlign: "center", fontSize: 14 }}
        >
          Enter your email address and we will send you a link to reset your
          password.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="ds-form-field">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="ds-input login-input"
            />
          </label>

          {error ? <div className="login-error">{error}</div> : null}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Sending…" : "Request reset link"}
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
