// apps/caisty-site/src/routes/ResetPasswordPage.tsx
import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword, setStoredPortalToken } from "../lib/portalApi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!token) {
      setError("Ungültiger Reset-Link. Bitte fordere einen neuen an.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
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

    setSubmitting(true);

    try {
      const result = await resetPassword(token, newPassword);
      
      if (result.token) {
        // Token speichern und automatisch einloggen
        setStoredPortalToken(result.token);
        setSuccess(true);
        
        // Kurze Verzögerung, dann zum Dashboard
        setTimeout(() => {
          navigate("/portal", { replace: true });
        }, 1500);
      } else {
        setError("Passwort wurde zurückgesetzt, aber Login fehlgeschlagen. Bitte melde dich manuell an.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Fehler beim Zurücksetzen des Passworts. Bitte erneut versuchen."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-6 shadow-xl shadow-black/40 text-center">
          <div className="mb-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <svg
                className="h-6 w-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-100 mb-1">
              Passwort erfolgreich zurückgesetzt
            </h1>
            <p className="text-xs text-slate-400">
              Du wirst jetzt automatisch eingeloggt…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-6 shadow-xl shadow-black/40">
          <h1 className="text-lg font-semibold text-slate-100 mb-1">
            Ungültiger Reset-Link
          </h1>
          <p className="text-xs text-slate-400 mb-5">
            Dieser Reset-Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Link
              to="/forgot-password"
              className="flex-1 text-center rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Neuen Link anfordern
            </Link>
            <Link
              to="/login"
              className="flex-1 text-center rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Zum Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-6 shadow-xl shadow-black/40">
        <h1 className="text-lg font-semibold text-slate-100 mb-1">
          Neues Passwort setzen
        </h1>
        <p className="text-xs text-slate-400 mb-5">
          Gib dein neues Passwort ein. Es muss mindestens 6 Zeichen lang sein.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs text-slate-300" htmlFor="newPassword">
              Neues Passwort
            </label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300" htmlFor="confirmPassword">
              Passwort bestätigen
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} fullWidth>
            {submitting ? "Wird gespeichert…" : "Passwort zurücksetzen"}
          </Button>
        </form>

        <div className="mt-4 flex justify-center">
          <Link
            to="/login"
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            ← Zurück zum Login
          </Link>
        </div>
      </div>
    </div>
  );
}

