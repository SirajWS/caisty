import React, { useEffect, useState } from "react";
import {
  createPortalSupportMessage,
  fetchPortalSupportMessages,
  type PortalSupportMessage,
} from "../lib/portalApi";

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
    <div className="portal-page">
      <h1 className="portal-page-title">Support & Kontakt</h1>
      <p className="portal-page-subtitle">
        Schick uns eine Nachricht, wenn du Hilfe brauchst oder Fragen zu deinem
        Konto hast.
      </p>

      {/* Formular */}
      <div
        style={{
          marginTop: 24,
          marginBottom: 32,
          padding: 24,
          borderRadius: 12,
          background: "#020617",
          border: "1px solid #1f2937",
          boxShadow: "0 15px 30px rgba(0,0,0,0.35)",
        }}
      >
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.5)",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.5)",
              fontSize: 13,
            }}
          >
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13 }}>Betreff</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="z. B. Frage zur Testlizenz oder Rechnung"
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #1f2937",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13 }}>Nachricht</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Beschreibe kurz dein Anliegen – je genauer, desto besser können wir helfen."
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #1f2937",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: 14,
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                border: "none",
                background: isSubmitting ? "#15803d" : "#22c55e",
                color: "#020617",
                fontWeight: 600,
                fontSize: 14,
                cursor: isSubmitting ? "default" : "pointer",
              }}
            >
              {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
            </button>
          </div>
        </form>
      </div>

      {/* Liste bisheriger Anfragen */}
      <div
        style={{
          marginTop: 8,
          padding: 20,
          borderRadius: 12,
          background: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Deine Anfragen</h2>

        {isLoadingList ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Lade deine bisherigen Anfragen …
          </p>
        ) : messages.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Du hast noch keine Support-Anfragen gestellt.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #1f2937",
                  background: "#020617",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {m.subject}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(m.createdAt)}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#e5e7eb",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.message}
                </div>

                <div style={{ marginTop: 8, fontSize: 11, color: "#9ca3af" }}>
                  Status:{" "}
                  <span style={{ textTransform: "capitalize" }}>
                    {m.status}
                  </span>
                </div>

                {m.replyText && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 10,
                      borderRadius: 6,
                      background: "rgba(37,99,235,0.15)",
                      border: "1px solid rgba(59,130,246,0.4)",
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#bfdbfe",
                        marginBottom: 4,
                      }}
                    >
                      Antwort vom Support{" "}
                      {m.repliedAt ? `(${formatDate(m.repliedAt)})` : ""}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{m.replyText}</div>
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
