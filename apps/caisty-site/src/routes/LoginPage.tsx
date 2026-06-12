import React from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { portalLogin, getGoogleAuthUrl } from "../lib/portalApi";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { useTheme } from "../lib/theme";
import { CaistyLogo } from "../components/CaistyLogo";

export default function LoginPage() {
  const { language } = useLanguage();
  const t = translations[language].auth.login;
  const layoutT = translations[language].common.layout;
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [searchParams] = useSearchParams();
  const noiseFilterId = React.useId().replace(/:/g, "");

  // Intentionally no default email/password — avoids prefilled credentials in production bundles.
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "oauth_error") {
      setError(t.errors.oauthError);
    } else if (errorParam === "missing_token") {
      setError(t.errors.missingToken);
    } else if (errorParam === "google_auth_failed") {
      setError(t.errors.googleAuthFailed);
    } else if (errorParam === "email_not_verified") {
      setError(t.errors.emailNotVerified);
    } else if (errorParam === "duplicate_provider") {
      setError(t.errors.duplicateProvider);
    } else if (errorParam === "db_migration_required") {
      setError(t.errors.dbMigrationRequired);
    } else if (errorParam === "invalid_customer") {
      setError(t.errors.invalidCustomer);
    }
  }, [searchParams, language, t]);

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
      setError(err instanceof Error ? err.message : translations[language].auth.login.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase =
    "w-full rounded-[10px] border px-[14px] py-2.5 text-sm transition-all duration-200 ease-out outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)]";
  const inputDark =
    "border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500";
  const inputLight =
    "border-slate-200 bg-slate-50 text-[#0f172a] placeholder:text-[#64748b] focus:border-orange-500";

  return (
    <div
      className={`login-page relative left-1/2 z-0 flex w-screen max-w-none -translate-x-1/2 flex-col items-center justify-center px-4 py-12 sm:py-16 min-h-[calc(100vh-3.75rem)] ${
        isLight ? "login-page--light" : ""
      }`}
    >
      <div className="login-page__mesh" aria-hidden />
      <svg className="login-page__noise h-full w-full" aria-hidden>
        <defs>
          <filter id={`login-noise-${noiseFilterId}`} x="0" y="0">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="mono" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter={`url(#login-noise-${noiseFilterId})`} fill="#ffffff" />
      </svg>

      <div className="relative z-10 w-full max-w-[420px]">
        <div
          className={`login-page__card login-font-heading w-full rounded-[24px] border p-10 shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl ${
            isLight
              ? "border-black/[0.08] border-t border-t-slate-100 bg-white shadow-slate-200/60"
              : "border border-white/[0.08] border-t-white/[0.12] bg-[rgba(15,21,32,0.85)]"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <CaistyLogo className="h-16 w-16" />
            <span
              className={`text-[18px] font-medium tracking-[1px] ${isLight ? "text-[#1a1a1a]" : "text-[#f0f0f0]"}`}
            >
              {layoutT.headerBrand}
            </span>
          </div>

          <h1
            className={`login-font-heading mt-6 text-2xl font-semibold tracking-tight ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            {t.title}
          </h1>
          <p className={`mt-1 text-[13px] leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            {t.subtitle}
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className={`mb-1 block text-xs font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}
                htmlFor="email"
              >
                {t.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputBase} ${isLight ? inputLight : inputDark}`}
              />
            </div>

            <div>
              <label
                className={`mb-1 block text-xs font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}
                htmlFor="password"
              >
                {t.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputBase} ${isLight ? inputLight : inputDark}`}
              />
            </div>

            {error && (
              <div
                className="flex gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-3 py-2.5 text-xs text-[#fca5a5]"
                role="alert"
              >
                <span className="shrink-0" aria-hidden>
                  ⚠
                </span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="login-font-heading flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-px hover:bg-orange-600 hover:shadow-[0_8px_24px_rgba(249,115,22,0.35)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {submitting && <span className="login-page__spinner" aria-hidden />}
              {submitting ? t.submitting : t.submit}
            </button>
          </form>

          <div className="mt-4 flex justify-end">
            <Link
              to="/forgot-password"
              className={`text-xs !text-slate-500 no-underline transition-colors ${
                isLight ? "hover:!text-orange-600" : "hover:!text-orange-300"
              }`}
            >
              {t.forgotPassword}
            </Link>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isLight ? "border-slate-200" : "border-white/[0.08]"}`} />
            </div>
            <div className="relative flex justify-center">
              <span
                className={`px-3 text-[11px] text-slate-500`}
                style={{ background: "var(--login-card-bg)" }}
              >
                {t.divider}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const base = getGoogleAuthUrl();
              const url = `${base}?state=login`;
              window.location.href = url;
            }}
            className={`login-font-heading mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm transition-all duration-200 ease-out ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                : "border-white/10 bg-white/[0.06] text-slate-200 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{t.google}</span>
          </button>

          <div
            className={`mt-6 flex items-center justify-between gap-3 text-xs ${
              isLight ? "text-slate-600" : "text-slate-500"
            }`}
          >
            <span>{t.noAccount}</span>
            <Link
              to="/register"
              className={`font-medium !text-orange-500 transition-colors hover:!text-orange-400 ${
                isLight ? "hover:!text-orange-600" : ""
              }`}
            >
              {t.registerLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
