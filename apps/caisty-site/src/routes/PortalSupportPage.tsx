import React, { useEffect, useState } from "react";
import {
  createPortalSupportMessage,
  fetchPortalSupportMessages,
  type PortalSupportMessage,
} from "../lib/portalApi";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { portalCardShell, portalPrimaryCta } from "../lib/portalUi";

export default function PortalSupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [messages, setMessages] = useState<PortalSupportMessage[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const locale = portalLocaleTag(language);
  const isLight = theme === "light";

  function formatDate(value: string | null | undefined) {
    if (!value) return "";
    const d = new Date(value);
    return d.toLocaleString(locale);
  }

  async function loadMessages() {
    try {
      setIsLoadingList(true);
      const items = await fetchPortalSupportMessages();
      setMessages(items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoadingList(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subject.trim() || !message.trim()) {
      setError(t.support.validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await createPortalSupportMessage({
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(t.support.successMessage);
      setSubject("");
      setMessage("");
      await loadMessages();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : t.support.sendError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className={`text-3xl font-semibold tracking-tight ${isLight ? "text-[#0B1220]" : "text-white"}`}>{t.support.title}</h1>
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
          {t.support.subtitle}
        </p>
      </header>

      <div className={portalCardShell(isLight)}>
        {error && (
          <div className={`mb-4 rounded-xl border px-3 py-2 text-xs ${isLight ? "border-rose-300 bg-rose-50 text-rose-800" : "border-rose-500/60 bg-rose-500/10 text-rose-200"}`}>
            {error}
          </div>
        )}
        {success && (
          <div className={`mb-4 rounded-xl border px-3 py-2 text-xs ${isLight ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"}`}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className={`text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>{t.support.subjectLabel}</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t.support.subjectPlaceholder}
              className={`rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-800 bg-[#0f172a] text-slate-100"}`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>{t.support.messageLabel}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={t.support.messagePlaceholder}
              className={`rounded-xl border px-3 py-2 text-sm resize-y outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-800 bg-[#0f172a] text-slate-100"}`}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${portalPrimaryCta()} disabled:opacity-60`}
            >
              {isSubmitting ? t.support.submitting : t.support.send}
            </button>
          </div>
        </form>
      </div>

      <div className={portalCardShell(isLight)}>
        <h2 className={`text-sm font-semibold mb-3 ${isLight ? "text-slate-900" : "text-slate-100"}`}>{t.support.requestsTitle}</h2>

        {isLoadingList ? (
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {t.support.loadingList}
          </p>
        ) : messages.length === 0 ? (
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {t.support.emptyList}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg border p-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60"}`}
              >
                <div className="flex justify-between mb-1 gap-2">
                  <div className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                    {m.subject}
                  </div>
                  <div className={`text-[11px] whitespace-nowrap ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    {formatDate(m.createdAt)}
                  </div>
                </div>
                <div className={`text-xs whitespace-pre-wrap ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  {m.message}
                </div>

                <div className={`mt-2 text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {t.support.statusLabel}{" "}
                  <span className="capitalize">
                    {m.status}
                  </span>
                </div>

                {m.replyText && (
                  <div className={`mt-2 rounded-lg border p-2.5 text-xs ${isLight ? "border-blue-200 bg-blue-50" : "border-blue-500/40 bg-blue-500/15"}`}>
                    <div className={`text-[11px] mb-1 ${isLight ? "text-blue-700" : "text-blue-300"}`}>
                      {t.support.replyTitle}{" "}
                      {m.repliedAt ? `(${formatDate(m.repliedAt)})` : ""}
                    </div>
                    <div className={`whitespace-pre-wrap ${isLight ? "text-blue-900" : "text-blue-100"}`}>{m.replyText}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
