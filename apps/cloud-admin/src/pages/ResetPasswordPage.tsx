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
      setError("Ungültiger Reset-Link. Bitte fordere einen neuen Link an.");
    }
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Ungültiger Reset-Link.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwörter stimmen nicht überein.");
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
        setError(res.error || "Fehler beim Zurücksetzen des Passworts");
        return;
      }

      setSuccess(true);
      
      // Nach erfolgreichem Reset: Zurück zum Login
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Fehler beim Zurücksetzen des Passworts");
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
            Passwort zurückgesetzt
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#94a3b8",
              marginBottom: "24px",
              lineHeight: "1.5",
            }}
          >
            Dein Passwort wurde erfolgreich zurückgesetzt. Du wirst zum Login weitergeleitet...
          </p>
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
            Neues Passwort setzen
          </p>
        </div>

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
              Neues Passwort
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  paddingRight: "44px",
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
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
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
              Passwort bestätigen
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  paddingRight: "44px",
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
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                }}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
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
            disabled={loading || !token}
            style={{
              width: "100%",
              padding: "12px 24px",
              background: loading || !token ? "#059669" : "#10b981",
              color: "#020617",
              fontSize: "16px",
              fontWeight: 600,
              border: "none",
              borderRadius: "8px",
              cursor: loading || !token ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: loading || !token ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading && token) {
                e.currentTarget.style.background = "#059669";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && token) {
                e.currentTarget.style.background = "#10b981";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {loading ? "Wird zurückgesetzt…" : "Passwort zurücksetzen"}
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

