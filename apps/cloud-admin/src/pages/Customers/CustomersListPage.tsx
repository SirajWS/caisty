import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

type Customer = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
};

type CustomersResponse = {
  items: Customer[];
  total: number;
  limit: number;
  offset: number;
};

export default function CustomersListPage() {
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    apiGet<CustomersResponse>("/customers?limit=20&offset=0")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ 
      padding: "24px 32px",
      maxWidth: "100%",
      width: "100%",
      boxSizing: "border-box"
    }}>
      <h1 style={{ fontSize: 28, marginBottom: 24, fontWeight: 600 }}>Customers</h1>

      {loading && <p style={{ color: "#9ca3af" }}>Loading customers…</p>}
      {error && (
        <p style={{ color: "#f97316", padding: 12, backgroundColor: "#1f2937", borderRadius: 8 }}>
          Fehler beim Laden der Kunden: {error}
        </p>
      )}

      {data && data.items.length === 0 && !loading && !error && (
        <p style={{ color: "#9ca3af" }}>Keine Kunden gefunden.</p>
      )}

      {data && data.items.length > 0 && (
        <div style={{ 
          overflowX: "auto",
          width: "100%",
          backgroundColor: "#0f172a",
          borderRadius: 8,
          border: "1px solid #1f2937"
        }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "600px"
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#1e293b" }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>E-Mail</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Erstellt am</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c, index) => (
                <tr 
                  key={c.id}
                  style={{ 
                    backgroundColor: index % 2 === 0 ? "#0f172a" : "#1e293b",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1f2937"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#0f172a" : "#1e293b"}
                >
                  <td style={tdStyle}>{c.name}</td>
                  <td style={tdStyle}>{c.email}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: c.status === "active" ? "#065f46" : "#7f1d1d",
                      color: c.status === "active" ? "#6ee7b7" : "#fca5a5"
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {new Date(c.createdAt).toLocaleString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #334155",
  padding: "12px 16px",
  fontWeight: 600,
  fontSize: 14,
  color: "#e5e7eb"
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #1e293b",
  padding: "12px 16px",
  fontSize: 14,
  color: "#d1d5db"
};