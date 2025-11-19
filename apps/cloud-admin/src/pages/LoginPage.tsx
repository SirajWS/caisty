import { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // M3: Hier später echten /auth/login Call machen.
    // Für jetzt: einfach weiter zum Dashboard.
    navigate("/dashboard");
  }

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "4rem auto",
        padding: 24,
        border: "1px solid #333",
        borderRadius: 8,
        background: "#020617",
        color: "#e5e7eb",
      }}
    >
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>Login (Dummy)</h1>
      <p style={{ fontSize: 14, marginBottom: 16 }}>
        M2: Noch kein echtes Login – beim Absenden kommst du direkt ins Dashboard.
      </p>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        <label style={{ fontSize: 14 }}>
          E-Mail
          <input
            type="email"
            placeholder="admin@caisty.local"
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 14 }}>
          Passwort
          <input
            type="password"
            placeholder="•••••••"
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        <button
          type="submit"
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "#0ea5e9",
            border: "none",
            borderRadius: 4,
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}
