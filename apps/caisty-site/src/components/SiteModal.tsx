import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type SiteModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  isLight: boolean;
  children: ReactNode;
  /** Slightly taller panel — reduces scrolling for content-rich modals. */
  tall?: boolean;
};

export function SiteModal({ open, onClose, title, closeLabel, isLight, children, tall }: SiteModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative z-[1] flex w-full max-w-lg ${
          tall ? "max-h-[min(92vh,860px)]" : "max-h-[min(90vh,720px)]"
        } flex-col overflow-hidden rounded-2xl border shadow-2xl outline-none ${
          isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f172a]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex shrink-0 items-start justify-between gap-4 border-b px-6 py-5 ${isLight ? "border-slate-200" : "border-white/10"}`}
        >
          <h2
            id={titleId}
            className={`pe-10 text-lg font-bold leading-tight lp-font-heading sm:text-xl ${isLight ? "text-slate-900" : "text-white"}`}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className={`absolute top-4 end-4 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              isLight ? "border-slate-200 text-slate-600 hover:bg-slate-100" : "border-white/15 text-slate-300 hover:bg-white/10"
            }`}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div
          className={`site-modal-body flex-1 overflow-y-auto overscroll-contain px-6 py-5 text-sm leading-relaxed ${
            isLight ? "text-slate-600" : "text-slate-300"
          }`}
        >
          {children}
        </div>

        <div className={`shrink-0 border-t px-6 py-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f172a]"}`}>
          <button type="button" onClick={onClose} className="lp-cta-primary w-full justify-center sm:w-auto">
            {closeLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
