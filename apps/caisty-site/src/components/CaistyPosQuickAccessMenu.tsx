import { useEffect, useRef, useState, type FocusEvent } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { POS_LANDING_PATH } from "../config/marketingRoutes";

const CLOSE_DELAY_MS = 130;

function quickAccessPrimary(): string {
  return "mkt-btn-primary !min-h-[2.25rem] !px-4 !text-xs !shadow-none w-full";
}

function quickAccessSecondary(): string {
  return "mkt-btn-secondary !min-h-[2.25rem] !px-4 !text-xs w-full";
}

function panelShell(): string {
  return "rounded-xl border p-2 flex min-w-[9.5rem] flex-col gap-1.5";
}

function posNavLinkClass(isActive: boolean): string {
  return ["mkt-nav-link", isActive ? "is-active" : ""].filter(Boolean).join(" ");
}

function useQuickAccessOpenState() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<number | null>(null);

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

  const handleFocusOut = (e: FocusEvent<HTMLDivElement>) => {
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
        className={posNavLinkClass(isActive)}
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
          <div
            className={panelShell()}
            style={{
              borderColor: "var(--mkt-border)",
              background: "var(--mkt-bg-elevated)",
              boxShadow: "var(--mkt-shadow)",
            }}
            role="menu"
          >
            <Link to="/register" role="menuitem" className={quickAccessPrimary()} onClick={() => setOpen(false)}>
              {props.registerLabel}
            </Link>
            <Link to="/login" role="menuitem" className={quickAccessSecondary()} onClick={() => setOpen(false)}>
              {props.loginLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Mobile: Caisty POS link with Register/Login underneath. */
export function MobileCaistyPosQuickAccessMenu(props: {
  label: string;
  registerLabel: string;
  loginLabel: string;
  isLight: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="py-1">
      <NavLink
        to={POS_LANDING_PATH}
        onClick={props.onNavigate}
        className={({ isActive }) => posNavLinkClass(isActive) + " block py-2"}
      >
        {props.label}
      </NavLink>
      <div className="flex flex-col gap-1.5 ps-1 pb-1" role="group" aria-label={props.label}>
        <Link to="/register" onClick={props.onNavigate} className={quickAccessPrimary() + " max-w-[11rem]"}>
          {props.registerLabel}
        </Link>
        <Link to="/login" onClick={props.onNavigate} className={quickAccessSecondary() + " max-w-[11rem]"}>
          {props.loginLabel}
        </Link>
      </div>
    </div>
  );
}
