import { useEffect, useId, useRef, useState, type FocusEvent } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  COMPANY_HOME,
  POS_LANDING_PATH,
  STAFF_LANDING_PATH,
} from "../config/marketingRoutes";

const CLOSE_DELAY_MS = 140;
const BUSINESS_HREF = `${COMPANY_HOME}#products`;

export type ProductsNavCopy = {
  productsLabel: string;
  posTitle: string;
  posStatus: string;
  businessTitle: string;
  businessStatus: string;
  staffTitle: string;
  staffStatus: string;
};

function useMenuOpenState() {
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
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
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

function statusClass(soon: boolean): string {
  return soon ? "mkt-products-menu__status mkt-products-menu__status--soon" : "mkt-products-menu__status";
}

/** Desktop Products dropdown: POS, Business, Staff. */
export function DesktopProductsNavMenu(props: { copy: ProductsNavCopy }) {
  const { pathname, hash } = useLocation();
  const menuId = useId();
  const { open, setOpen, wrapRef, openMenu, scheduleClose, clearLeave, handleFocusOut } =
    useMenuOpenState();
  const productsActive =
    pathname === POS_LANDING_PATH ||
    pathname === STAFF_LANDING_PATH ||
    (pathname === COMPANY_HOME && hash === "#products");

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={handleFocusOut}
    >
      <button
        type="button"
        className={["mkt-nav-link mkt-nav-link--button", productsActive ? "is-active" : ""]
          .filter(Boolean)
          .join(" ")}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{props.copy.productsLabel}</span>
        <svg
          className="mkt-products-menu__chevron"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden
        >
          <path
            d="M3 4.5 6 7.5 9 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <div
          className="absolute start-0 top-full z-50 pt-1.5"
          onMouseEnter={clearLeave}
          onMouseLeave={scheduleClose}
        >
          <ul
            id={menuId}
            className="mkt-products-menu"
            role="menu"
            style={{
              borderColor: "var(--mkt-border)",
              background: "var(--mkt-bg-elevated)",
              boxShadow: "var(--mkt-shadow)",
            }}
          >
            <li role="none">
              <NavLink
                to={POS_LANDING_PATH}
                role="menuitem"
                className="mkt-products-menu__item"
                onClick={() => setOpen(false)}
              >
                <span className="mkt-products-menu__name">{props.copy.posTitle}</span>
                <span className={statusClass(false)}>{props.copy.posStatus}</span>
              </NavLink>
            </li>
            <li role="none">
              <Link
                to={BUSINESS_HREF}
                role="menuitem"
                className="mkt-products-menu__item"
                onClick={() => setOpen(false)}
              >
                <span className="mkt-products-menu__name">{props.copy.businessTitle}</span>
                <span className={statusClass(false)}>{props.copy.businessStatus}</span>
              </Link>
            </li>
            <li role="none">
              <NavLink
                to={STAFF_LANDING_PATH}
                role="menuitem"
                className="mkt-products-menu__item mkt-products-menu__item--soon"
                onClick={() => setOpen(false)}
              >
                <span className="mkt-products-menu__name">{props.copy.staffTitle}</span>
                <span className={statusClass(true)}>{props.copy.staffStatus}</span>
              </NavLink>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Mobile Products accordion list. */
export function MobileProductsNavMenu(props: {
  copy: ProductsNavCopy;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  return (
    <div className="mkt-products-mobile">
      <button
        type="button"
        className="mkt-nav-link mkt-nav-link--button mkt-products-mobile__trigger"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{props.copy.productsLabel}</span>
        <svg
          className={`mkt-products-menu__chevron${open ? " is-open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden
        >
          <path
            d="M3 4.5 6 7.5 9 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <ul id={menuId} className="mkt-products-mobile__list">
          <li>
            <NavLink to={POS_LANDING_PATH} className="mkt-products-menu__item" onClick={props.onNavigate}>
              <span className="mkt-products-menu__name">{props.copy.posTitle}</span>
              <span className={statusClass(false)}>{props.copy.posStatus}</span>
            </NavLink>
          </li>
          <li>
            <Link to={BUSINESS_HREF} className="mkt-products-menu__item" onClick={props.onNavigate}>
              <span className="mkt-products-menu__name">{props.copy.businessTitle}</span>
              <span className={statusClass(false)}>{props.copy.businessStatus}</span>
            </Link>
          </li>
          <li>
            <NavLink
              to={STAFF_LANDING_PATH}
              className="mkt-products-menu__item mkt-products-menu__item--soon"
              onClick={props.onNavigate}
            >
              <span className="mkt-products-menu__name">{props.copy.staffTitle}</span>
              <span className={statusClass(true)}>{props.copy.staffStatus}</span>
            </NavLink>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
