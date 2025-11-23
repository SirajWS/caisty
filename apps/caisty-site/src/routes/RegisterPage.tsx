// apps/caisty-site/src/routes/RegisterPage.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { portalRegister } from "../lib/portalApi";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await portalRegister({ name, email, password });
      navigate("/portal", { replace: true });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Registrierung fehlgeschlagen. Bitte erneut versuchen."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-6 shadow-xl shadow-black/40">
        <h1 className="text-lg font-semibold text-slate-100 mb-1">
          Caisty-Konto erstellen
        </h1>
        <p className="text-xs text-slate-400 mb-5">
          Lege deine Organisation an und erhalte Zugriff auf das Kundenportal
          für Lizenzen, Rechnungen und POS-Downloads.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs text-slate-300" htmlFor="name">
              Organisationsname
            </label>
            <input
              id="name"
              type="text"
              autoComplete="organization"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300" htmlFor="email">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300" htmlFor="password">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {submitting ? "Konto wird erstellt…" : "Konto erstellen"}
          </button>
        </form>

        <div className="mt-4 flex justify-between text-[11px] text-slate-400">
          <span>Schon ein Konto?</span>
          <Link
            to="/login"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Zum Login
          </Link>
        </div>
      </div>
    </div>
  );
}
