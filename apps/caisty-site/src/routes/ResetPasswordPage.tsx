// apps/caisty-site/src/routes/ResetPasswordPage.tsx
import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword, setStoredPortalToken } from "../lib/portalApi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const t = translations[language].auth.resetPassword;
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
      setError(translations[language].auth.resetPassword.errInvalidLink);
    }
  }, [token, language]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(t.errInvalidLinkShort);
      return;
    }

    if (newPassword.length < 6) {
      setError(t.errPasswordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.errPasswordsMismatch);
      return;
    }

    setSubmitting(true);

    try {
      const result = await resetPassword(token, newPassword);

      if (result.token) {
        setStoredPortalToken(result.token);
        setSuccess(true);

        setTimeout(() => {
          navigate("/portal", { replace: true });
        }, 1500);
      } else {
        setError(t.errResetNoLogin);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : translations[language].auth.resetPassword.genericError);
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
            <h1 className="text-lg font-semibold text-slate-100 mb-1">{t.successTitle}</h1>
            <p className="text-xs text-slate-400">{t.successRedirecting}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-6 shadow-xl shadow-black/40">
          <h1 className="text-lg font-semibold text-slate-100 mb-1">{t.invalidLinkPageTitle}</h1>
          <p className="text-xs text-slate-400 mb-5">{t.invalidLinkPageBody}</p>

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
              {t.requestNewLink}
            </Link>
            <Link
              to="/login"
              className="flex-1 text-center rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {t.goToLogin}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-6 shadow-xl shadow-black/40">
        <h1 className="text-lg font-semibold text-slate-100 mb-1">{t.setTitle}</h1>
        <p className="text-xs text-slate-400 mb-5">{t.setSubtitle}</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs text-slate-300" htmlFor="newPassword">
              {t.newPasswordLabel}
            </label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t.newPasswordPlaceholder}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300" htmlFor="confirmPassword">
              {t.confirmLabel}
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.confirmPlaceholder}
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
