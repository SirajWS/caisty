// apps/caisty-site/src/routes/ForgotPasswordPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../lib/portalApi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const t = translations[language].auth.forgotPassword;
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

      if (result.resetLink) {
        setResetLink(result.resetLink);
        console.log("Reset-Link erhalten:", result.resetLink);
      } else {
        console.log("Kein Reset-Link in Response (normal in Production)");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : translations[language].auth.forgotPassword.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-6 shadow-xl shadow-black/40">
          <h1 className="text-lg font-semibold text-slate-100 mb-1">{t.successTitle}</h1>
          <p className="text-xs text-slate-400 mb-5">{t.successBody}</p>

          {resetLink && (
            <div className="mb-5 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">
                <strong className="text-slate-300">{t.devModeLabel}</strong> {t.devModeIntro}
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
            <p className="text-xs text-slate-300">{t.successCheckEmail}</p>
            <p className="text-xs text-slate-400">{t.successValidFor}</p>
          </div>

          <div className="mt-6 flex justify-center">
            <Link to="/login" className="text-sm text-emerald-400 hover:text-emerald-300">
              {t.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-6 shadow-xl shadow-black/40">
        <h1 className="text-lg font-semibold text-slate-100 mb-1">{t.title}</h1>
        <p className="text-xs text-slate-400 mb-5">{t.subtitle}</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs text-slate-300" htmlFor="email">
              {t.emailLabel}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} fullWidth>
            {submitting ? t.submitting : t.submit}
          </Button>
        </form>

        <div className="mt-4 flex justify-center">
          <Link to="/login" className="text-sm text-emerald-400 hover:text-emerald-300">
            {t.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
}
