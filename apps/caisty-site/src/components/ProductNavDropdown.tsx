import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { CommonTranslations } from "../lib/translations/common";
import { POS_LANDING_PATH } from "../config/marketingRoutes";

type ProductMenuCopy = CommonTranslations["productMenu"];

function StatusBadge(props: {
  children: React.ReactNode;
  tone: "available" | "soon";
  isLight: boolean;
}) {
  const base =
    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide leading-none";
  if (props.tone === "available") {
    return (
      <span
        className={
          props.isLight
            ? `${base} border-emerald-300 bg-emerald-50 text-emerald-800`
            : `${base} border-emerald-500/30 bg-emerald-500/15 text-emerald-300`
        }
      >
        {props.children}
      </span>
    );
  }
  return (
    <span
      className={
        props.isLight
          ? `${base} border-slate-200 bg-slate-100 text-slate-600`
          : `${base} border-orange-500/35 bg-orange-500/10 text-orange-200`
      }
    >
      {props.children}
    </span>
  );
}

function shiftiqFeatures(m: ProductMenuCopy): string[] {
  return [m.shiftiqFeature1, m.shiftiqFeature2, m.shiftiqFeature3, m.shiftiqFeature4, m.shiftiqFeature5];
}

function productNavPill(isLight: boolean): string {
  return isLight
    ? "flex min-h-[2rem] items-center justify-center rounded-lg border border-slate-200/90 bg-white px-2 py-1 text-center text-[11px] font-semibold leading-snug text-slate-700 no-underline shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50/90 hover:text-[#c2410c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f97316]"
    : "flex min-h-[2rem] items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-center text-[11px] font-semibold leading-snug text-slate-200 no-underline transition-colors hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f97316]";
}

function DesktopMegaPanel(props: {
  productMenu: ProductMenuCopy;
  isLight: boolean;
  onPick?: () => void;
}) {
  const m = props.productMenu;
  const { isLight } = props;
  const pill = productNavPill(isLight);
  const navLinks: { to: string; label: string }[] = [
    { to: POS_LANDING_PATH, label: m.posOverview },
    { to: "/pricing", label: m.posPricing },
    { to: `${POS_LANDING_PATH}#payment`, label: m.posPayment },
    { to: `${POS_LANDING_PATH}#fiscal`, label: m.posFiscal },
  ];

  const heading = isLight ? "text-[15px] font-bold tracking-tight text-slate-900" : "text-[15px] font-bold tracking-tight text-slate-50";
  const bodyMuted = isLight ? "text-slate-500" : "text-slate-400";
  const listText = isLight ? "text-slate-600" : "text-slate-300";
  const check = isLight ? "text-emerald-600" : "text-emerald-400";
  const secondaryBtn = isLight
    ? "inline-flex min-h-[2.25rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-800 no-underline shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f97316]"
    : "inline-flex min-h-[2.25rem] items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-4 text-[12px] font-semibold text-slate-100 no-underline transition-colors hover:border-white/25 hover:bg-white/[0.1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f97316]";
  const shiftiqFooter = isLight
    ? "mt-3.5 flex w-full min-h-[2.5rem] items-center justify-center rounded-lg border border-slate-200 bg-white py-2.5 text-center text-[12px] font-semibold text-slate-800 no-underline shadow-sm transition-colors hover:border-[#f97316] hover:bg-orange-50 hover:text-[#c2410c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f97316]"
    : "mt-3.5 flex w-full min-h-[2.5rem] items-center justify-center rounded-lg border border-white/15 bg-white/[0.05] py-2.5 text-center text-[12px] font-semibold text-slate-100 no-underline transition-colors hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f97316]";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2">
      {/* Left — Caisty POS */}
      <div className="p-4 sm:p-5">
        <div className="flex gap-2.5">
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f97316] shadow-[0_0_0_3px_rgba(249,115,22,0.2)]"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={heading}>{m.posTitle}</h3>
              <StatusBadge tone="available" isLight={isLight}>
                {m.posStatus}
              </StatusBadge>
            </div>
            <p className={`mt-1.5 text-[12px] leading-snug ${bodyMuted}`}>{m.posDescription}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/register"
                onClick={props.onPick}
                className="inline-flex min-h-[2.25rem] items-center justify-center rounded-lg bg-[#f97316] px-4 text-[12px] font-semibold text-white no-underline transition-colors hover:bg-[#ea580c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
                role="menuitem"
              >
                {m.ctaStartFree}
              </Link>
              <Link to="/login" onClick={props.onPick} className={secondaryBtn} role="menuitem">
                {m.ctaLogin}
              </Link>
            </div>
            <nav className="mt-3 grid grid-cols-2 gap-1.5" aria-label={m.posTitle}>
              {navLinks.map((item) => (
                <Link key={item.to} to={item.to} className={pill} onClick={props.onPick} role="menuitem">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Right — ShiftIQ preview */}
      <div
        className={
          isLight
            ? "border-t border-slate-100 bg-slate-50/70 p-4 sm:border-l sm:border-t-0 sm:p-5"
            : "border-t border-white/10 bg-white/[0.03] p-4 sm:border-l sm:border-t-0 sm:p-5"
        }
      >
        <div className="flex gap-2.5">
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f97316]/70 shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={heading}>{m.shiftiqTitle}</h3>
              <StatusBadge tone="soon" isLight={isLight}>
                {m.shiftiqStatus}
              </StatusBadge>
            </div>
            <p className={`mt-1.5 text-[12px] leading-snug ${bodyMuted}`}>{m.shiftiqDescription}</p>
            <ul className={`mt-3 space-y-1.5 text-[12px] leading-snug ${listText}`} aria-label={m.shiftiqTitle}>
              {shiftiqFeatures(m).map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className={`shrink-0 font-bold ${check}`} aria-hidden>
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <Link to="/shiftiq" onClick={props.onPick} role="menuitem" className={shiftiqFooter}>
              {m.shiftiqNavCta}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Desktop: «Product» mega menu (Caisty POS + ShiftIQ preview). */
export function DesktopProductNavDropdown(props: {
  navProductLabel: string;
  productMenu: ProductMenuCopy;
  isLight: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const clearLeave = () => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
  };

  const scheduleClose = () => {
    clearLeave();
    leaveTimer.current = window.setTimeout(() => setOpen(false), 160);
  };

  const triggerMuted = props.isLight ? "text-slate-600 hover:text-[#0b1220]" : "text-slate-300 hover:text-white";
  const triggerActive = "text-[#f97316]";

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => {
        clearLeave();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1 border-0 bg-transparent p-0 text-sm font-medium cursor-pointer transition-colors ${open ? triggerActive : triggerMuted}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${props.navProductLabel} menu`}
        onClick={() => setOpen((o) => !o)}
      >
        {props.navProductLabel}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 pt-1.5"
          onMouseEnter={clearLeave}
          onMouseLeave={scheduleClose}
        >
          <div
            className={
              props.isLight
                ? "w-[min(calc(100vw-2rem),47.5rem)] min-w-0 overflow-hidden rounded-xl border border-slate-200/95 bg-white text-slate-900 shadow-lg shadow-slate-900/10 ring-1 ring-black/[0.04] lg:min-w-[42.5rem]"
                : "w-[min(calc(100vw-2rem),47.5rem)] min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#111827] text-slate-100 shadow-lg shadow-black/40 lg:min-w-[42.5rem]"
            }
            role="menu"
          >
            <DesktopMegaPanel
              productMenu={props.productMenu}
              isLight={props.isLight}
              onPick={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const mobilePill = (isLight: boolean) =>
  `flex min-h-[2.25rem] items-center justify-center rounded-lg border px-2 py-1 text-center text-[11px] font-semibold leading-snug no-underline transition-colors ${
    isLight
      ? "border-slate-200/90 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50 hover:text-[#c2410c]"
      : "border-white/10 bg-white/[0.06] text-slate-200 hover:border-[#fb923c]/35 hover:bg-white/[0.1]"
  }`;

/** Mobile: «Product» accordion — Caisty POS actions + ShiftIQ preview (no link). */
export function MobileProductNavGroup(props: {
  navProductLabel: string;
  productMenu: ProductMenuCopy;
  isLight: boolean;
  mobileMenuOpen: boolean;
  onCloseMobile: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const m = props.productMenu;
  const p = mobilePill(props.isLight);

  useEffect(() => {
    if (!props.mobileMenuOpen) setExpanded(false);
  }, [props.mobileMenuOpen]);

  const row = props.isLight ? "text-slate-700" : "text-slate-200";

  return (
    <div className={`border-b pb-1 ${props.isLight ? "border-slate-200/60" : "border-white/[0.08]"}`}>
      <button
        type="button"
        className={`flex w-full items-center justify-between py-2 text-left text-sm font-medium ${row}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
      >
        {props.navProductLabel}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <div
          className={`mt-1 space-y-3 rounded-xl border p-3 ${
            props.isLight ? "border-slate-200 bg-slate-50/90" : "border-white/10 bg-white/[0.04]"
          }`}
        >
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${props.isLight ? "text-slate-500" : "text-slate-400"}`}>
              {m.posTitle}
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Link
                to="/register"
                onClick={props.onCloseMobile}
                className="inline-flex min-h-[2.5rem] flex-1 min-w-[8rem] items-center justify-center rounded-full bg-[#f97316] px-3 text-xs font-semibold text-white no-underline"
              >
                {m.ctaStartFree}
              </Link>
              <Link
                to="/login"
                onClick={props.onCloseMobile}
                className={
                  props.isLight
                    ? "inline-flex min-h-[2.5rem] flex-1 min-w-[8rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 no-underline"
                    : "inline-flex min-h-[2.5rem] flex-1 min-w-[8rem] items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-3 text-xs font-semibold text-slate-100 no-underline"
                }
              >
                {m.ctaLogin}
              </Link>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <Link to={POS_LANDING_PATH} onClick={props.onCloseMobile} className={p}>
                {m.posOverview}
              </Link>
              <Link to="/pricing" onClick={props.onCloseMobile} className={p}>
                {m.posPricing}
              </Link>
              <Link to={`${POS_LANDING_PATH}#payment`} onClick={props.onCloseMobile} className={p}>
                {m.posPayment}
              </Link>
              <Link to={`${POS_LANDING_PATH}#fiscal`} onClick={props.onCloseMobile} className={p}>
                {m.posFiscal}
              </Link>
            </div>
          </div>
          <div className={`border-t pt-2 ${props.isLight ? "border-slate-200/80" : "border-white/[0.08]"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${props.isLight ? "text-slate-500" : "text-slate-400"}`}>
              {m.shiftiqTitle}
            </p>
            <p className={`mt-0.5 text-[10px] font-bold uppercase text-slate-400`}>{m.shiftiqStatus}</p>
            <p className={`mt-1 text-[11px] leading-snug ${props.isLight ? "text-slate-600" : "text-slate-400"}`}>{m.shiftiqDescription}</p>
            <ul className={`mt-2 space-y-1 text-[11px] ${props.isLight ? "text-slate-600" : "text-slate-400"}`}>
              {shiftiqFeatures(m).map((line, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="font-bold text-emerald-600" aria-hidden>
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/shiftiq"
              onClick={props.onCloseMobile}
              className={`mt-2 flex w-full min-h-[2.5rem] items-center justify-center rounded-lg border py-2 text-[11px] font-semibold no-underline ${
                props.isLight
                  ? "border-slate-200 bg-white text-slate-800 hover:border-[#f97316]"
                  : "border-white/15 bg-white/[0.06] text-slate-100 hover:border-[#fb923c]/40"
              }`}
            >
              {m.shiftiqNavCta}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
