import React, { useEffect, useState } from "react";
import {
  createPortalSupportMessage,
  fetchPortalSupportMessages,
  type PortalSupportMessage,
} from "../lib/portalApi";
import { useTheme } from "../lib/theme";

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleString();
}

export default function PortalSupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [messages, setMessages] = useState<PortalSupportMessage[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const { theme } = useTheme();
  const isLight = theme === "light";

  async function loadMessages() {
    try {
      setIsLoadingList(true);
      const items = await fetchPortalSupportMessages();
      // neueste zuerst
      setMessages(items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
    } catch (err: any) {
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
      setError("Bitte Betreff und Nachricht ausfüllen.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPortalSupportMessage({
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(
        "Deine Nachricht wurde gesendet. Wir melden uns so schnell wie möglich.",
      );
      setSubject("");
      setMessage("");
      await loadMessages();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Fehler beim Senden der Nachricht.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className={`text-2xl font-semibold tracking-tight ${isLight ? "text-slate-900" : "text-slate-50"}`}>Support & Kontakt</h1>
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
          Schick uns eine Nachricht, wenn du Hilfe brauchst oder Fragen zu deinem
          Konto hast.
        </p>
      </header>

      {/* Formular */}
      <div className={`rounded-2xl border p-6 ${isLight ? "border-slate-200 bg-white shadow-sm" : "border-slate-800 bg-slate-900/60"}`}>
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
            <label className={`text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>Betreff</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="z. B. Frage zur Testlizenz oder Rechnung"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-800 bg-slate-950/60 text-slate-100"}`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>Nachricht</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Beschreibe kurz dein Anliegen – je genauer, desto besser können wir helfen."
              className={`rounded-lg border px-3 py-2 text-sm resize-vertical outline-none focus:border-emerald-500 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-800 bg-slate-950/60 text-slate-100"}`}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
            </button>
          </div>
        </form>
      </div>

      {/* Liste bisheriger Anfragen */}
      <div className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/60"}`}>
        <h2 className={`text-sm font-semibold mb-3 ${isLight ? "text-slate-900" : "text-slate-100"}`}>Deine Anfragen</h2>

        {isLoadingList ? (
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            Lade deine bisherigen Anfragen …
          </p>
        ) : messages.length === 0 ? (
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            Du hast noch keine Support-Anfragen gestellt.
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
                  Status:{" "}
                  <span className="capitalize">
                    {m.status}
                  </span>
                </div>

                {m.replyText && (
                  <div className={`mt-2 rounded-lg border p-2.5 text-xs ${isLight ? "border-blue-200 bg-blue-50" : "border-blue-500/40 bg-blue-500/15"}`}>
                    <div className={`text-[11px] mb-1 ${isLight ? "text-blue-700" : "text-blue-300"}`}>
                      Antwort vom Support{" "}
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
