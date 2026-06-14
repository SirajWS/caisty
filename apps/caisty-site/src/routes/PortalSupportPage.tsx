import React, { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import {
  createPortalSupportMessage,
  fetchPortalSupportMessages,
  type PortalSupportMessage,
} from "../lib/portalApi";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { portalCardShell, portalInputClass, portalPrimaryCta } from "../lib/portalUi";

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
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isLight ? "text-[#0B1220]" : "text-white"}`}>{t.support.title}</h1>
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className={`text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>{t.support.subjectLabel}</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t.support.subjectPlaceholder}
              className={portalInputClass(isLight)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>{t.support.messageLabel}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={t.support.messagePlaceholder}
              className={`min-h-[8rem] resize-y ${portalInputClass(isLight)}`}
            />
          </div>

          <div className="flex w-full flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full justify-center sm:w-auto ${portalPrimaryCta()} disabled:opacity-60`}
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
          <div className={`flex flex-col items-center py-8 text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            <Inbox className="mb-3 h-8 w-8 opacity-80" strokeWidth={1.25} aria-hidden />
            <p className="text-sm">{t.support.emptyList}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg border p-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60"}`}
              >
                <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                  <div className={`min-w-0 text-sm font-medium ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                    {m.subject}
                  </div>
                  <div className={`shrink-0 text-[11px] sm:text-right ${isLight ? "text-slate-500" : "text-slate-400"}`}>
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
