import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { POS_LANDING_PATH } from "../config/marketingRoutes";

const CLOSE_DELAY_MS = 130;

function quickAccessPrimary(): string {
  return [
    "inline-flex min-h-[2.25rem] w-full items-center justify-center rounded-full px-4 text-xs font-semibold text-white no-underline transition-colors",
    "bg-[#f97316] hover:bg-[#ea580c]",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]",
  ].join(" ");
}

function quickAccessSecondary(isLight: boolean): string {
  return isLight
    ? "inline-flex min-h-[2.25rem] w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 no-underline transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
    : "inline-flex min-h-[2.25rem] w-full items-center justify-center rounded-full border border-white/25 bg-transparent px-4 text-xs font-semibold text-white no-underline transition-colors hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]";
}

function panelShell(isLight: boolean): string {
  return isLight
    ? "rounded-xl border border-slate-200/95 bg-white p-2 shadow-lg shadow-slate-900/10 ring-1 ring-black/[0.04]"
    : "rounded-xl border border-white/10 bg-[#111827] p-2 shadow-lg shadow-black/40";
}

function posNavLinkClass(isActive: boolean, isLight: boolean): string {
  return [
    "text-sm font-medium no-underline transition-colors",
    isActive
      ? "text-[#f97316]"
      : isLight
        ? "text-slate-600 hover:text-[#0b1220]"
        : "text-slate-300 hover:text-white",
  ].join(" ");
}

function useQuickAccessOpenState() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLeave = () => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
  };

  const scheduleClose = () => {
    clearLeave();
    leaveTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const openMenu = () => {
    clearLeave();
    setOpen(true);
  };

  const handleFocusOut = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (wrapRef.current && next && wrapRef.current.contains(next)) return;
    scheduleClose();
  };

  return { open, setOpen, wrapRef, openMenu, scheduleClose, clearLeave, handleFocusOut };
}

/** Desktop: Caisty POS nav link + hover/focus quick-access dropdown. */
export function DesktopCaistyPosQuickAccessMenu(props: {
  label: string;
  registerLabel: string;
  loginLabel: string;
  isLight: boolean;
}) {
  const { pathname } = useLocation();
  const isActive = pathname === POS_LANDING_PATH;
  const { open, setOpen, wrapRef, openMenu, scheduleClose, clearLeave, handleFocusOut } =
    useQuickAccessOpenState();

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={handleFocusOut}
    >
      <NavLink
        to={POS_LANDING_PATH}
        className={posNavLinkClass(isActive, props.isLight)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {props.label}
      </NavLink>
      {open ? (
        <div
          className="absolute left-0 top-full z-50 pt-1.5"
          onMouseEnter={clearLeave}
          onMouseLeave={scheduleClose}
        >
          <div className={`${panelShell(props.isLight)} flex min-w-[9.5rem] flex-col gap-1.5`} role="menu">
            <Link
              to="/register"
              role="menuitem"
              className={quickAccessPrimary()}
              onClick={() => setOpen(false)}
            >
              {props.registerLabel}
            </Link>
            <Link
              to="/login"
              role="menuitem"
              className={quickAccessSecondary(props.isLight)}
              onClick={() => setOpen(false)}
            >
              {props.loginLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Mobile: Caisty POS link with Register/Login always visible underneath
 * (no extra tap — matches flat mobile nav list).
 */
export function MobileCaistyPosQuickAccessMenu(props: {
  label: string;
  registerLabel: string;
  loginLabel: string;
  isLight: boolean;
  onNavigate: () => void;
}) {
  const row = props.isLight ? "text-slate-700" : "text-slate-200";

  return (
    <div className="py-1">
      <NavLink
        to={POS_LANDING_PATH}
        onClick={props.onNavigate}
        className={({ isActive }) =>
          `block text-sm font-medium py-2 no-underline ${isActive ? "text-[#f97316]" : row}`
        }
      >
        {props.label}
      </NavLink>
      <div className={`flex flex-col gap-1.5 ps-1 pb-1 ${row}`} role="group" aria-label={props.label}>
        <Link
          to="/register"
          onClick={props.onNavigate}
          className={`${quickAccessPrimary()} max-w-[11rem]`}
        >
          {props.registerLabel}
        </Link>
        <Link
          to="/login"
          onClick={props.onNavigate}
          className={`${quickAccessSecondary(props.isLight)} max-w-[11rem]`}
        >
          {props.loginLabel}
        </Link>
      </div>
    </div>
  );
}
