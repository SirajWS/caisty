import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { portalLogin } from "../lib/portalApi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const [email, setEmail] = React.useState("admin@example.com");
  const [password, setPassword] = React.useState("admin123");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-6 shadow-xl shadow-black/40">
        <h1 className="text-lg font-semibold text-slate-100 mb-1">
          Im Kundenportal anmelden
        </h1>
        <p className="text-xs text-slate-400 mb-5">
          Verwalte Lizenzen, Geräte, Rechnungen und POS-Downloads in deinem
          Caisty-Konto.
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
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300" htmlFor="password">
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

        <div className="mt-4 flex justify-between text-[11px] text-slate-400">
          <span>Noch kein Konto?</span>
          <Link
            to="/register"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Jetzt registrieren
          </Link>
        </div>
      </div>
    </div>
  );
}
