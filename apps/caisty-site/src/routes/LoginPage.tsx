import React from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { portalLogin } from "../lib/portalApi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useTheme } from "../lib/theme";

export default function LoginPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [searchParams] = useSearchParams();

  const [email, setEmail] = React.useState("admin@example.com");
  const [password, setPassword] = React.useState("admin123");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Prüfe URL-Parameter für Fehlermeldungen
  React.useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "oauth_error") {
      setError("Google-Anmeldung fehlgeschlagen. Bitte versuche es erneut.");
    } else if (errorParam === "missing_token") {
      setError("Anmeldung fehlgeschlagen: Token fehlt. Bitte versuche es erneut.");
    } else if (errorParam === "google_auth_failed") {
      setError("Google-Anmeldung wurde abgebrochen.");
    } else if (errorParam === "email_not_verified") {
      setError("Deine Google-E-Mail ist nicht verifiziert. Bitte verifiziere sie zuerst.");
    } else if (errorParam === "duplicate_provider") {
      setError("Diese Google-Account ist bereits mit einem anderen Konto verknüpft. Bitte verwende ein anderes Google-Konto oder melde dich mit E-Mail und Passwort an.");
    } else if (errorParam === "db_migration_required") {
      setError("Datenbank-Migration erforderlich. Bitte kontaktiere den Support.");
    } else if (errorParam === "invalid_customer") {
      setError("Ungültiges Konto. Bitte kontaktiere den Support.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await portalLogin({ email, password });
      const target = location.state?.from || "/portal";
      navigate(target, { replace: true });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Login fehlgeschlagen. Bitte erneut versuchen."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8">
      <div
        className={`w-full max-w-md rounded-3xl border px-6 py-6 shadow-xl ${
          isLight
            ? "border-slate-200 bg-white shadow-slate-200/40"
            : "border-slate-800 bg-slate-900/70 shadow-black/40"
        }`}
      >
        <h1
          className={`text-lg font-semibold mb-1 ${
            isLight ? "text-slate-900" : "text-slate-100"
          }`}
        >
          Im Kundenportal anmelden
        </h1>
        <p
          className={`text-xs mb-5 ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}
        >
          Verwalte Lizenzen, Geräte, Rechnungen und POS-Downloads in deinem
          Caisty-Konto.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label
              className={`text-xs ${
                isLight ? "text-slate-700" : "text-slate-300"
              }`}
              htmlFor="email"
            >
              E-Mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label
              className={`text-xs ${
                isLight ? "text-slate-700" : "text-slate-300"
              }`}
              htmlFor="password"
            >
              Passwort
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} fullWidth>
            {submitting ? "Anmelden…" : "Anmelden"}
          </Button>
        </form>

        <div className="mt-3 flex justify-end">
          <Link
            to="/forgot-password"
            className="text-[11px] text-emerald-400 hover:text-emerald-300"
          >
            Passwort vergessen?
          </Link>
        </div>

        <div className="mt-4 relative">
          <div className="absolute inset-0 flex items-center">
            <div
              className={`w-full border-t ${
                isLight ? "border-slate-300" : "border-slate-700"
              }`}
            ></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span
              className={`px-2 ${
                isLight
                  ? "bg-white text-slate-500"
                  : "bg-slate-900/70 text-slate-400"
              }`}
            >
              oder
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = `${import.meta.env.VITE_CLOUD_API_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:3333"}/portal/auth/google?state=login`;
          }}
          className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors text-sm ${
            isLight
              ? "border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700"
              : "border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200"
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Mit Google anmelden</span>
        </button>

        <div
          className={`mt-4 flex justify-between text-[11px] ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}
        >
          <span>Noch kein Konto?</span>
          <Link
            to="/register"
            className="text-emerald-500 hover:text-emerald-600"
          >
            Jetzt registrieren
          </Link>
        </div>
      </div>
    </div>
  );
}
