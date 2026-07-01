import type { CommonTranslations } from "../lib/translations/common";
import { SiteModal } from "./SiteModal";

type FooterModalsProps = {
  active: null | "company" | "contact";
  onClose: () => void;
  isLight: boolean;
  copy: CommonTranslations["footer"];
};

function modalList(items: string[]) {
  return (
    <ul className="m-0 mt-1.5 space-y-1 ps-0 list-none">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f97316]" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function FooterModals({ active, onClose, isLight, copy }: FooterModalsProps) {
  const m = copy.companyModal;
  const c = copy.contactModal;

  return (
    <>
      <SiteModal
        open={active === "company"}
        onClose={onClose}
        title={m.title}
        closeLabel={m.close}
        isLight={isLight}
        tall
      >
        <div className="space-y-3">
          <p className="m-0">{m.summary}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className={`m-0 font-semibold ${isLight ? "text-slate-800" : "text-slate-100"}`}>{m.focusTitle}</p>
              {modalList(m.focusItems)}
            </div>
            <div>
              <p className={`m-0 font-semibold ${isLight ? "text-slate-800" : "text-slate-100"}`}>{m.principlesTitle}</p>
              {modalList(m.principlesItems)}
            </div>
          </div>
        </div>
      </SiteModal>

      <SiteModal
        open={active === "contact"}
        onClose={onClose}
        title={c.title}
        closeLabel={c.close}
        isLight={isLight}
      >
        <div className="space-y-5">
          <div>
            <p className={`m-0 font-semibold ${isLight ? "text-slate-800" : "text-slate-100"}`}>{c.generalLabel}</p>
            <a href="mailto:info@caisty.com" className="mt-1 inline-block font-semibold text-[#f97316] hover:text-[#ea580c] no-underline">
              info@caisty.com
            </a>
          </div>
          <div>
            <p className={`m-0 font-semibold ${isLight ? "text-slate-800" : "text-slate-100"}`}>{c.supportLabel}</p>
            <a href="mailto:support@caisty.com" className="mt-1 inline-block font-semibold text-[#f97316] hover:text-[#ea580c] no-underline">
              support@caisty.com
            </a>
          </div>
          <div>
            <p className={`m-0 font-semibold ${isLight ? "text-slate-800" : "text-slate-100"}`}>{c.hoursTitle}</p>
            <p className="m-0 mt-1">{c.hoursSchedule}</p>
            <p className="m-0">{c.hoursTime}</p>
          </div>
          <div>
            <p className={`m-0 font-semibold ${isLight ? "text-slate-800" : "text-slate-100"}`}>{c.responseTitle}</p>
            <p className="m-0 mt-1">{c.responseBody}</p>
          </div>
        </div>
      </SiteModal>
    </>
  );
}
