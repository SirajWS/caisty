import { useEffect, useState } from "react";
import { Clock, Headphones, Mail, Timer } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { useTheme } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { applyCompanySiteMeta, applyContactSiteMeta } from "../lib/siteDocumentMeta";

const sectionShell = "w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8";
const sectionPad = "py-16 sm:py-20";

function cardShell(isLight: boolean) {
  return `rounded-2xl border p-6 sm:p-8 flex flex-col h-full transition-shadow hover:shadow-lg ${
    isLight ? "border-slate-200 bg-white shadow-sm hover:border-orange-100" : "border-white/10 bg-[#0f172a]/60 hover:border-white/15"
  }`;
}

function inputClass(isLight: boolean) {
  return `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 ${
    isLight
      ? "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
      : "border-white/10 bg-white/[0.04] text-slate-100 placeholder:text-slate-500"
  }`;
}

export default function ContactPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const t = translations[language].contact;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [formNotice, setFormNotice] = useState<string | null>(null);

  useEffect(() => {
    applyContactSiteMeta();
    return () => {
      applyCompanySiteMeta();
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) return;

    const body = [`Name: ${name.trim()}`, `Email: ${email.trim()}`, "", message.trim()].join("\n");
    const mailto = `mailto:info@caisty.com?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setFormNotice(t.form.success);
  }

  return (
    <div
      className={`contact-page landing-page min-h-screen w-full max-w-[100vw] overflow-x-clip ${isLight ? "landing-page--light bg-[#f8fafc]" : "bg-[#0b1220]"}`}
    >
      {/* Hero */}
      <section className={`relative overflow-x-clip border-b ${isLight ? "border-slate-200/80" : "border-white/[0.06]"}`}>
        <div
          className={`pointer-events-none absolute inset-0 ${isLight ? "bg-gradient-to-br from-orange-500/[0.12] via-transparent to-slate-200/40" : "bg-gradient-to-br from-orange-500/10 via-transparent to-transparent"}`}
          aria-hidden
        />
        <div className={`${sectionShell} relative z-[1] pt-12 pb-14 sm:pt-16 sm:pb-16 max-w-3xl`}>
          <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold tracking-tight text-[var(--color-text-primary)] lp-font-heading leading-[1.12] mb-4">
            {t.hero.title}
          </h1>
          <p className="m-0 text-base sm:text-lg leading-relaxed text-[var(--color-text-muted)]">{t.hero.subtitle}</p>
        </div>
      </section>

      {/* Contact cards */}
      <section className={`${sectionShell} ${sectionPad} border-b ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="grid gap-6 lg:grid-cols-2">
          <article className={cardShell(isLight)}>
            <div
              className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${isLight ? "border-orange-200/80 bg-orange-50 text-[#c2410c]" : "border-orange-500/25 bg-orange-500/10 text-orange-200"}`}
              aria-hidden
            >
              <Mail className="h-5 w-5" strokeWidth={2} />
            </div>
            <h2 className={`text-lg font-bold lp-font-heading mb-2 ${isLight ? "text-slate-900" : "text-slate-100"}`}>{t.cards.general.title}</h2>
            <a
              href={`mailto:${t.cards.general.email}`}
              className="text-base font-semibold text-[#f97316] hover:text-[#ea580c] no-underline mb-3 inline-block"
            >
              {t.cards.general.email}
            </a>
            <p className={`m-0 text-sm leading-relaxed mt-auto ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.cards.general.description}</p>
          </article>

          <article className={cardShell(isLight)}>
            <div
              className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${isLight ? "border-orange-200/80 bg-orange-50 text-[#c2410c]" : "border-orange-500/25 bg-orange-500/10 text-orange-200"}`}
              aria-hidden
            >
              <Headphones className="h-5 w-5" strokeWidth={2} />
            </div>
            <h2 className={`text-lg font-bold lp-font-heading mb-2 ${isLight ? "text-slate-900" : "text-slate-100"}`}>{t.cards.support.title}</h2>
            <a
              href={`mailto:${t.cards.support.email}`}
              className="text-base font-semibold text-[#f97316] hover:text-[#ea580c] no-underline mb-3 inline-block"
            >
              {t.cards.support.email}
            </a>
            <p className={`m-0 text-sm leading-relaxed mt-auto ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.cards.support.description}</p>
          </article>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-8 max-w-2xl">
          <div
            className={`flex items-start gap-4 rounded-xl border p-4 sm:p-5 ${isLight ? "border-slate-200 bg-slate-50/80" : "border-white/10 bg-white/[0.03]"}`}
          >
            <Clock className={`h-5 w-5 shrink-0 mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`} strokeWidth={2} aria-hidden />
            <div>
              <h3 className={`text-sm font-bold mb-1 ${isLight ? "text-slate-900" : "text-slate-100"}`}>{t.hours.title}</h3>
              <p className={`m-0 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.hours.schedule}</p>
              <p className={`m-0 text-sm font-medium ${isLight ? "text-slate-800" : "text-slate-200"}`}>{t.hours.time}</p>
            </div>
          </div>
          <div
            className={`flex items-start gap-4 rounded-xl border p-4 sm:p-5 ${isLight ? "border-slate-200 bg-slate-50/80" : "border-white/10 bg-white/[0.03]"}`}
          >
            <Timer className={`h-5 w-5 shrink-0 mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`} strokeWidth={2} aria-hidden />
            <div>
              <h3 className={`text-sm font-bold mb-1 ${isLight ? "text-slate-900" : "text-slate-100"}`}>{t.response.title}</h3>
              <p className={`m-0 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.response.body}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className={`${sectionShell} pb-16 sm:pb-20`}>
        <div className={`max-w-xl mx-auto ${cardShell(isLight)}`}>
          <h2 className={`text-lg font-bold lp-font-heading mb-6 ${isLight ? "text-slate-900" : "text-slate-100"}`}>{t.form.title}</h2>

          {formNotice && (
            <div
              className={`mb-5 rounded-xl border px-4 py-3 text-sm ${isLight ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"}`}
              role="status"
            >
              {formNotice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-name" className={`text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {t.form.name}
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className={inputClass(isLight)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="contact-email" className={`text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {t.form.email}
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputClass(isLight)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="contact-subject" className={`text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {t.form.subject}
              </label>
              <input
                id="contact-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className={inputClass(isLight)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="contact-message" className={`text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {t.form.message}
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className={`min-h-[8rem] resize-y ${inputClass(isLight)}`}
              />
            </div>

            <div className="pt-1">
              <Button type="submit" fullWidth className="min-h-[48px]">
                {t.form.submit}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
