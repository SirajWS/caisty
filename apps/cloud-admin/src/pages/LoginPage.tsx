export default function LoginPage() {
    return (
      <div style={{ maxWidth: 360, margin: "4rem auto", padding: 24, border: "1px solid #333", borderRadius: 8 }}>
        <h1 style={{ fontSize: 20, marginBottom: 12 }}>Login (Dummy)</h1>
        <p style={{ fontSize: 14, marginBottom: 16 }}>
          Hier kommt später das echte Login mit JWT & Rollen hin. Für M1 ist das nur eine Platzhalter-Seite.
        </p>
        <form style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
            type="button"
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
            Login (noch ohne Funktion)
          </button>
        </form>
      </div>
    );
  }
  