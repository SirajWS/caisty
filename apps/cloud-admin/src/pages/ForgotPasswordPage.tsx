// apps/cloud-admin/src/pages/ForgotPasswordPage.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiPost } from "../lib/api";

type ForgotPasswordResponse = {
  ok: boolean;
  message?: string;
  error?: string;
  resetLink?: string; // Nur in Development
};

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
        setError(res.error || "Fehler beim Anfordern des Reset-Links");
        return;
      }

      setSuccess(true);
      
      // In Development: Reset-Link anzeigen
      if (res.resetLink) {
        setResetLink(res.resetLink);
        console.log("Reset-Link erhalten:", res.resetLink);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Fehler beim Anfordern des Reset-Links");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)",
          padding: "20px",
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
            backdropFilter: "blur(10px)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "16px",
            }}
          >
            ✅
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#f1f5f9",
              marginBottom: "12px",
            }}
          >
            E-Mail gesendet
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#94a3b8",
              marginBottom: "24px",
              lineHeight: "1.5",
            }}
          >
            Wenn ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen des Passworts gesendet.
          </p>

          {resetLink && (
            <div
              style={{
                padding: "16px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#6ee7b7",
                  marginBottom: "8px",
                  fontWeight: 500,
                }}
              >
                Development-Modus: Reset-Link
              </p>
              <a
                href={resetLink}
                style={{
                  fontSize: "12px",
                  color: "#10b981",
                  wordBreak: "break-all",
                  textDecoration: "none",
                }}
              >
                {resetLink}
              </a>
            </div>
          )}

          <Link
            to="/login"
            style={{
              display: "inline-block",
              color: "#10b981",
              textDecoration: "none",
              fontSize: "14px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#059669";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#10b981";
            }}
          >
            ← Zurück zum Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)",
        padding: "20px",
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
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#f1f5f9",
              marginBottom: "8px",
              letterSpacing: "-0.5px",
            }}
          >
            Caisty <span style={{ color: "#10b981" }}>Admin</span>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "#94a3b8",
              marginTop: "8px",
            }}
          >
            Passwort zurücksetzen
          </p>
        </div>

        <p
          style={{
            fontSize: "14px",
            color: "#94a3b8",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                boxSizing: "border-box",
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
              background: loading ? "#059669" : "#10b981",
              color: "#020617",
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
            {loading ? "Wird gesendet…" : "Reset-Link anfordern"}
          </button>

          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <Link
              to="/login"
              style={{
                fontSize: "12px",
                color: "#10b981",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#059669";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#10b981";
              }}
            >
              ← Zurück zum Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

