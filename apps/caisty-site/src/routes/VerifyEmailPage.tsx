import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../lib/portalApi";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { useTheme } from "../lib/theme";
import { CaistyLogo } from "../components/CaistyLogo";

type VerifyState = "loading" | "success" | "invalid" | "missing";

export default function VerifyEmailPage() {
  const { language } = useLanguage();
  const t = translations[language].auth.verifyEmail;
  const layoutT = translations[language].common.layout;
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const noiseFilterId = React.useId().replace(/:/g, "");

  const [state, setState] = React.useState<VerifyState>(
    token ? "loading" : "missing",
  );
  const [errorDetail, setErrorDetail] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) {
      setState("missing");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await verifyEmail(token);
        if (!cancelled) setState("success");
      } catch (err) {
        if (!cancelled) {
          setState("invalid");
          setErrorDetail(
            err instanceof Error ? err.message : t.genericError,
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, t.genericError]);

  const cardClass = `login-page__card login-font-heading w-full max-w-[420px] rounded-[24px] border p-10 shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl ${
    isLight
      ? "border-black/[0.08] border-t border-t-slate-100 bg-white shadow-slate-200/60"
      : "border border-white/[0.08] border-t-white/[0.12] bg-[rgba(15,21,32,0.85)]"
  }`;

  const titleClass = `login-font-heading text-2xl font-semibold tracking-tight ${
    isLight ? "text-slate-900" : "text-white"
  }`;

  const bodyClass = `mt-2 text-[13px] leading-relaxed ${
    isLight ? "text-slate-600" : "text-slate-400"
  }`;

  function renderContent() {
    if (state === "loading") {
      return (
        <>
          <h1 className={titleClass}>{t.loadingTitle}</h1>
          <p className={bodyClass}>{t.loadingBody}</p>
          <div className="mt-8 flex justify-center">
            <span className="login-page__spinner" aria-hidden />
          </div>
        </>
      );
    }

    if (state === "success") {
      return (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
            <svg
              className="h-6 w-6 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className={titleClass}>{t.successTitle}</h1>
          <p className={bodyClass}>{t.successBody}</p>
          <Link
            to="/login"
            className="login-font-heading mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-orange-500 text-sm font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-px hover:bg-orange-600 hover:shadow-[0_8px_24px_rgba(249,115,22,0.35)]"
          >
            {t.goToLogin}
          </Link>
        </>
      );
    }

    if (state === "missing") {
      return (
        <>
          <h1 className={titleClass}>{t.missingTitle}</h1>
          <p className={bodyClass}>{t.missingBody}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className={`flex-1 text-center rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                isLight
                  ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10"
              }`}
            >
              {t.createAccount}
            </Link>
            <Link
              to="/login"
              className={`flex-1 text-center rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                isLight
                  ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10"
              }`}
            >
              {t.goToLogin}
            </Link>
          </div>
        </>
      );
    }

    return (
      <>
        <h1 className={titleClass}>{t.invalidTitle}</h1>
        <p className={bodyClass}>{t.invalidBody}</p>
        {errorDetail && (
          <div
            className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-3 py-2.5 text-xs text-[#fca5a5]"
            role="alert"
          >
            {errorDetail}
          </div>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/login"
            className={`flex-1 text-center rounded-xl border px-4 py-2.5 text-sm transition-colors ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10"
            }`}
          >
            {t.goToLogin}
          </Link>
          <Link
            to="/register"
            className="login-font-heading flex-1 text-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            {t.createAccount}
          </Link>
        </div>
      </>
    );
  }

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
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" in="noise" result="mono" />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter={`url(#login-noise-${noiseFilterId})`}
          fill="#ffffff"
        />
      </svg>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className={cardClass}>
          <div className="flex flex-col items-center gap-2">
            <CaistyLogo className="h-16 w-16" />
            <span
              className={`text-[18px] font-medium tracking-[1px] ${isLight ? "text-[#1a1a1a]" : "text-[#f0f0f0]"}`}
            >
              {layoutT.headerBrand}
            </span>
          </div>
          <div className="mt-6 text-center">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
