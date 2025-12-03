// apps/caisty-site/src/routes/ForgotPasswordPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../lib/portalApi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [resetLink, setResetLink] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await requestPasswordReset(email);
      setSuccess(true);
      
      // Zeige Reset-Link an (wenn vorhanden - normalerweise nur in Development)
      if (result.resetLink) {
        setResetLink(result.resetLink);
        console.log("Reset-Link erhalten:", result.resetLink);
      } else {
        console.log("Kein Reset-Link in Response (normal in Production)");
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Fehler beim Anfordern des Reset-Links. Bitte erneut versuchen."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-6 shadow-xl shadow-black/40">
          <h1 className="text-lg font-semibold text-slate-100 mb-1">
            Reset-Link angefordert
          </h1>
          <p className="text-xs text-slate-400 mb-5">
            Wenn ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.
          </p>

          {resetLink && (
            <div className="mb-5 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">
                <strong className="text-slate-300">Development-Modus:</strong> Reset-Link:
              </p>
              <a
                href={resetLink}
                className="text-xs text-emerald-400 hover:text-emerald-300 break-all"
                target="_blank"
                rel="noopener noreferrer"
              >
                {resetLink}
              </a>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Prüfe dein E-Mail-Postfach und klicke auf den Link, um dein Passwort zurückzusetzen.
            </p>
            <p className="text-xs text-slate-400">
              Der Link ist 1 Stunde gültig.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
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

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-6 shadow-xl shadow-black/40">
        <h1 className="text-lg font-semibold text-slate-100 mb-1">
          Passwort zurücksetzen
        </h1>
        <p className="text-xs text-slate-400 mb-5">
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs text-slate-300" htmlFor="email">
              E-Mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} fullWidth>
            {submitting ? "Wird gesendet…" : "Reset-Link anfordern"}
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

